import {
  NanceConfig,
  Proposal,
} from "@nance/nance-sdk";
import { SnapshotHandler } from "../snapshot/snapshotHandler";
import { getDb } from "../dolt/pools";
import { keys } from "../keys";
import { dotPin } from "../storage/storageHandler";
import logger from "../logging";
import {
  addSecondsToDate,
} from "../utils";

export const voteSetup = async (space: string, config: NanceConfig, endDate: Date, proposals?: Proposal[]) => {
  try {
    const dolt = getDb(space);
    const voteProposals = proposals || await dolt.getProposals({ status: ["Voting"] }).then((res) => res.proposals);
    if (!voteProposals || voteProposals.length === 0) return [];
    const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, config);
    const snapshotVoteSettings = await snapshot.getVotingSettings().then((settings) => {
      return settings;
    }).catch((e) => {
      logger.error(`error getting snapshot vote settings for ${space}`);
      logger.error(e);
      return undefined;
    });

    // used to pick a more random previous block to take snapshot of token balances per DrGorilla.eth"s recommendation
    const blockJitter = Math.floor(Math.random() * 100);

    const updatedProposals = await Promise.all(voteProposals.map(async (proposal) => {
      const startJitter = Math.floor(Math.random() * 100); // it seems that sometimes proposals uploaded at same time are rejected by Snapshot API
      const start = addSecondsToDate(new Date(), startJitter);
      // if a space has a period set, a proposal must be submitted with that period
      const end = (snapshotVoteSettings?.period)
        ? addSecondsToDate(start, snapshotVoteSettings.period)
        : endDate;
      const { body } = proposal;
      const proposalWithHeading = `# ${proposal.proposalId} - ${proposal.title}${body}`;
      const ipfsURL = await dotPin(proposalWithHeading);
      const type = (proposal.voteSetup) ? proposal.voteSetup.type : (snapshotVoteSettings?.type || "basic");
      const voteURL = await snapshot.createProposal(
        proposal,
        start,
        end,
        { type, choices: proposal.voteSetup?.choices || config.snapshot.choices },
        blockJitter
      );
      const updatedProposal: Proposal = { ...proposal, ipfsURL, voteURL };
      await dolt.updateVotingSetup(updatedProposal);
      return updatedProposal;
    })).catch((e) => {
      return Promise.reject(e);
    });
    return updatedProposals;
  } catch (e) {
    logger.error(`error setting up vote for ${space}`);
    logger.error(e);
    return Promise.reject(e);
  }
};
