import { Router, Request } from "express";
import { ProposalUploadRequest } from "@nance/nance-sdk";
import { Middleware } from "./middleware";
import { cache } from "@/api/helpers/cache";
import { postSummary } from "@/nancearizer";
import { discordLogin } from "@/api/helpers/discord";
import { addressFromSignature } from "@/api/helpers/auth";

const router = Router({ mergeParams: true });

type ProposalQueryParams = {
  cycle: string,
  keyword: string,
  author: string,
  limit: string,
  page: string
};

// query proposals
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

// upload new proposal
router.post('/', async (req: Request, res) => {
  const { space } = req.params;
  const { proposal, envelope } = req.body as ProposalUploadRequest;
  try {
    const { config, dolt, bearerAddress, currentCycle, currentEvent } = res.locals as Middleware;
    const uploaderAddress = bearerAddress || envelope?.address;
    if (!proposal) { res.json({ success: false, error: '[NANCE ERROR]: proposal object validation fail' }); return; }
    if (!uploaderAddress) { res.json({ success: false, error: '[NANCE ERROR]: missing address for proposal upload' }); return; }
    let receipt: string | undefined;
    let snapshotId: string | undefined;
    if (envelope && !bearerAddress) {
      const decodedAddress = await addressFromSignature(envelope);
      if (uploaderAddress !== decodedAddress) {
        res.json({
          success: false,
          error: `address and signature do not match\naddress: ${uploaderAddress}\nsignature: ${decodedAddress}`
        });
        return;
      }
      receipt = await dotPin(formatSnapshotEnvelope(envelope));
      snapshotId = getSnapshotId(envelope);
    }

    // check author snapshot voting power
    // if author doesn't meet the minimum balance, set author to undefined and add uploaderAddress to coauthors
    // then a valid author will need to resign the proposal to move it to Temperature Check
    let authorAddress: string | undefined = uploaderAddress;
    let authorMeetsValidation = false;
    let { coauthors } = proposal;
    const { status } = proposal;
    const {
      proposalSubmissionValidation,
      allowCurrentCycleSubmission,
    } = config;
    if (proposalSubmissionValidation) {
      const { minBalance } = proposalSubmissionValidation;
      const balance = await getAddressVotingPower(uploaderAddress, config.snapshot.space);
      if (balance < minBalance) {
        authorAddress = undefined;
        coauthors = !coauthors ? [uploaderAddress] : uniq([...coauthors, uploaderAddress]);
        proposal.status = (status === "Discussion") ? proposalSubmissionValidation.notMetStatus : proposal.status;
      } else {
        authorMeetsValidation = true;
        proposal.status = (status === "Discussion") ? proposalSubmissionValidation.metStatus : proposal.status;
      }
    }

    const newProposal: Proposal = {
      ...proposal,
      uuid: proposal.uuid || uuidGen(),
      createdTime: proposal.createdTime || new Date().toISOString(),
      authorAddress,
      coauthors,
      voteURL: snapshotId,
    };

    if (!newProposal.governanceCycle) {
      if (
        currentEvent.title === "Temperature Check" &&
        allowCurrentCycleSubmission
      ) {
        newProposal.governanceCycle = currentCycle;
      }
      newProposal.governanceCycle = currentCycle + 1;
    }
    if (newProposal.status === "Archived") newProposal.status = "Discussion"; // proposal forked from an archive, set to discussion
    if (config.submitAsApproved) newProposal.status = "Approved";

    console.log('======================================================');
    console.log('==================== NEW PROPOSAL ====================');
    console.log('======================================================');
    console.log(`space ${space}, author ${uploaderAddress}`);
    console.dir(newProposal, { depth: null });
    console.log('======================================================');
    console.log('======================================================');
    console.log('======================================================');
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
            if (authorMeetsValidation || !proposalSubmissionValidation) await discord.setupPoll(getLastSlash(discussionThreadURL));
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
