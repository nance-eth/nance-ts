/* eslint-disable no-nested-ternary */
import { oneLine } from "common-tags";
import { ProposalPacket, ProposalStatus, SnapshotProposal, SQLSnapshotProposal } from "@nance/nance-sdk";
import { getDb } from "./pools";
import { cleanResultsHeader } from "./doltSQL";

const cacheSnapshotProposalToProposal = (cacheProposal: SQLSnapshotProposal): ProposalPacket => {
  return {
    uuid: 'snapshot',
    title: cacheProposal.title,
    body: cacheProposal.body,
    status: cacheProposal.proposalStatus as ProposalStatus,
    authorAddress: cacheProposal.authorAddress,
    createdTime: new Date(cacheProposal.startTimestamp * 1000).toISOString(),
    lastEditedTime: new Date(cacheProposal.startTimestamp * 1000).toISOString(),
    discussionThreadURL: cacheProposal.discussionURL,
    voteURL: cacheProposal.snapshotId,
    voteSetup: {
      type: cacheProposal.voteType,
      choices: cacheProposal.choices,
    },
    actions: [],
    voteResults: {
      votes: cacheProposal.votes,
      scores: cacheProposal.scores,
      choices: cacheProposal.choices,
      scoresTotal: cacheProposal.scoresTotal,
      quorumMet: false,
    },
    proposalSummary: cacheProposal.proposalSummary,
    proposalInfo: {
      snapshotSpace: cacheProposal.snapshotSpace,
      proposalIdPrefix: '',
      minTokenPassingAmount: 0,
      nextProposalId: 0,
    }
  };
};

export const getCacheSnapshotProposal = async (snapshotId: string): Promise<ProposalPacket | undefined> => {
  const dolt = getDb("common");
  const proposal = await dolt.localDolt.db.query(oneLine`
    SELECT * from proposals
    WHERE snapshotId = ?
    LIMIT 1
  `, [snapshotId]).then((res: any) => {
    const row = res[0][0];
    if (row) return row as SQLSnapshotProposal;
    return undefined;
  }).catch((e) => {
    return Promise.reject(e);
  });
  if (!proposal) return undefined;
  return cacheSnapshotProposalToProposal(proposal);
};

export const setCacheSnapshotProposal = async (
  sProposal: SnapshotProposal,
  proposalSummary?: string
): Promise<boolean> => {
  const dolt = getDb("common");
  let status = "Voting";
  if (sProposal.state === 'closed') {
    if (sProposal.scores[0] > sProposal.scores[1]) {
      status = "Approved";
    } else {
      status = "Cancelled";
    }
  }
  return dolt.localDolt.db.query(oneLine`
    INSERT INTO proposals (
      snapshotSpace,
      snapshotId,
      title,
      body,
      authorAddress,
      discussionURL,
      startTimestamp,
      endTimestamp,
      voteType,
      proposalStatus,
      quorum,
      votes,
      choices,
      scores,
      scoresTotal,
      proposalSummary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      proposalStatus = VALUES(proposalStatus),
      votes = VALUES(votes),
      choices = VALUES(choices),
      scores = VALUES(scores),
      scoresTotal = VALUES(scoresTotal),
      proposalSummary = VALUES(proposalSummary)
  `, [
    sProposal.space?.id,
    sProposal.id,
    sProposal.title,
    sProposal.body,
    sProposal.author,
    sProposal.discussion,
    sProposal.start,
    sProposal.end,
    sProposal.type,
    status,
    sProposal.quorum,
    sProposal.votes,
    JSON.stringify(sProposal.choices),
    JSON.stringify(sProposal.scores),
    sProposal.scores_total,
    proposalSummary
  ]).then((res) => {
    if (cleanResultsHeader(res) === 1) return true;
    return false;
  }).catch((e) => {
    return Promise.reject(e);
  });
};
