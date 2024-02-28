import { oneLine } from "common-tags";
import { pools } from "./pools";
import { Proposal, SnapshotProposal } from "../types";
import { SQLSnapshotProposal } from "./schema";
import { cleanResultsHeader, resStatus } from "./doltSQL";
import { STATUS } from "../constants";

const cacheSnapshotProposalToProposal = (cacheProposal: SQLSnapshotProposal): Proposal => {
  return {
    hash: 'snapshot',
    title: cacheProposal.title,
    body: cacheProposal.body,
    status: STATUS.VOTING,
    authorAddress: cacheProposal.authorAddress,
    proposalId: null,
    createdTime: new Date(cacheProposal.startTimestamp * 1000),
    discussionThreadURL: cacheProposal.discussionURL,
    ipfsURL: '',
    voteURL: cacheProposal.snapshotId,
    snapshotSpace: cacheProposal.snapshotSpace,
    proposalSummary: cacheProposal.proposalSummary,
  };
};

export const getCacheSnapshotProposal = async (snapshotId: string): Promise<Proposal | undefined> => {
  const dolt = pools.common;
  const proposal = await dolt.db.query(oneLine`
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
  const dolt = pools.common;
  return dolt.db.query(oneLine`
    INSERT INTO proposals (
      snapshotSpace,
      snapshotId,
      title,
      body,
      authorAddress,
      discussionURL,
      startTimestamp,
      endTimestamp,
      proposalSummary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
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
    proposalSummary
  ]).then((res) => {
    if (cleanResultsHeader(res) === 1) return true;
    return false;
  }).catch((e) => {
    return Promise.reject(e);
  });
};
