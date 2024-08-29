import { Router, Request } from "express";
import { ProposalUploadRequest } from "@nance/nance-sdk";
import { Middleware } from "./middleware";
import { cache } from "@/api/helpers/cache";
import { postSummary } from "@/nancearizer";
import { discordLogin } from "@/api/helpers/discord";
import { validateUploaderAddress } from "@/api/helpers/snapshotUtils";
import { validateUploaderVp } from "@/api/helpers/proposal/validateProposal";
import { buildProposal } from "@/api/helpers/proposal/buildProposal";
import { getLastSlash } from "@/utils";
import { logProposal } from "@/api/helpers/proposal/logProposal";

const router = Router({ mergeParams: true });

type ProposalQueryParams = {
  cycle: string,
  keyword: string,
  author: string,
  limit: string,
  page: string
};

// GET /:space/proposals
// GET /:space/proposals?cycle=1&keyword=keyword&author=author&limit=10&page=1
router.get("/", async (req: Request, res) => {
  const { space } = req.params;
  try {
    const { cycle, keyword, author, limit, page } = req.query as ProposalQueryParams;
    const { dolt, config, currentCycle } = res.locals as Middleware;

    // calculate offset for SQL pagination
    const _limit = limit ? Number(limit) : 0;
    const _page = page ? Number(page) : 0;
    const _offset = _page ? (_page - 1) * _limit : 0;

    const cycleSearch = cycle || currentCycle.toString();

    // cache
    const key = `${space}:${JSON.stringify(req.query)}`;
    let data = cache[space]?.proposalsPacket?.[key];
    if (data) {
      return res.send({ success: true, data });
    }

    const { proposals, hasMore } = await dolt.getProposals({
      governanceCycle: cycleSearch,
      keyword,
      author,
      limit: _limit,
      offset: _offset
    });

    data = {
      proposalInfo: {
        snapshotSpace: config?.snapshot.space || space,
        proposalIdPrefix: config.proposalIdPrefix,
        minTokenPassingAmount: config?.snapshot.minTokenPassingAmount || 0,
        nextProposalId: cache[space].nextProposalId || 0,
      },
      proposals,
      hasMore,
    };

    cache[space].proposalsPacket = { ...cache[space].proposalsPacket, [key]: data };

    return res.send({ success: true, data });
  } catch (e) {
    return res.send({ success: false, error: `[NANCE] ${e}` });
  }
});

// POST /:space/proposals
router.post('/', async (req: Request, res) => {
  try {
    const { space } = req.params;
    const { proposal, envelope } = req.body as ProposalUploadRequest;
    const { config, dolt, address, currentCycle, currentEvent, nextProposalId } = res.locals as Middleware;

    const { uploaderAddress, receipt, snapshotId } = await validateUploaderAddress(address, envelope);
    const { authorAddress, coauthors, status } = await validateUploaderVp({ proposal, uploaderAddress, config });

    const newProposal = buildProposal({
      proposal,
      status,
      authorAddress,
      coauthors,
      snapshotId,
      currentCycle,
      currentEvent,
      nextProposalId,
      config,
    });
    logProposal(proposal, space, uploaderAddress, "new");
    dolt.addProposalToDb(newProposal, receipt).then(async (proposalRes) => {
      const { uuid } = proposalRes;
      proposal.uuid = uuid;

      // return uuid to client, then continue doing things
      res.json({ success: true, data: { uuid } });

      try {
        if (newProposal.status === "Discussion" || newProposal.status === "Temperature Check") {
          const discord = await discordLogin(config);
          try {
            const discussionThreadURL = await discord.startDiscussion(newProposal);
            if (authorAddress) await discord.setupPoll(getLastSlash(discussionThreadURL));
            await dolt.updateDiscussionURL({ ...newProposal, discussionThreadURL });
            discord.logout();
          } catch (e) {
            console.error(`[DISCORD] ${e}`);
          }
        }

        if (space !== "waterbox") {
          const summary = await postSummary(newProposal, "proposal");
          dolt.updateSummary(uuid, summary, "proposal");
        }
        // update nextProposalId cache
        if (proposalRes.proposalId) {
          cache[space].nextProposalId = proposalRes.proposalId + 1;
        }

        // clear proposal cache
        cache[space].proposalsPacket = {};
      } catch (e) {
        console.error(`[DISCORD] ${space}`);
        console.error(`[DISCORD] ${e}`);
      }
    }).catch((e: any) => {
      res.json({ success: false, error: `[DATABASE ERROR]: ${e}` });
    });
  } catch (e: any) { res.json({ success: false, error: e.toString() }); }
});

export default router;
