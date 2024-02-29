import { request as gqlRequest, gql } from 'graphql-request';
import { Proposal, SnapshotProposal } from "../types";
import { STATUS } from '../constants';
import { getCacheSnapshotProposal, setCacheSnapshotProposal } from "../dolt/doltCommon";
import { postSummary } from "../nancearizer";

const hub = 'https://hub.snapshot.org';

export const snapshotProposalToProposal = (sProposal: SnapshotProposal, quorum: number): Proposal => {
  let status = STATUS.VOTING;
  if (sProposal.state === 'closed') {
    status = sProposal.scores[0] > sProposal.scores[1] ? STATUS.APPROVED : STATUS.CANCELLED;
  }
  const title = sProposal.title || 'Title Unknown';
  return {
    hash: 'snapshot',
    title,
    body: sProposal.body || 'Body Unknown',
    status,
    authorAddress: sProposal.author,
    proposalId: null,
    createdTime: new Date(Number(sProposal.start) * 1000),
    discussionThreadURL: sProposal.discussion || '',
    ipfsURL: sProposal.ipfs || '',
    voteURL: sProposal.id,
    snapshotSpace: sProposal.space?.id || '',
    voteSetup: {
      type: sProposal.type,
      choices: sProposal.choices,
    },
    voteResults: {
      votes: sProposal.votes,
      scores: sProposal.scores,
      choices: sProposal.choices,
      scores_total: sProposal.scores_total,
      quorumMet: sProposal.scores_total >= quorum,
    }
  };
};

export const fetchSnapshotProposal = async (snapshotId: string): Promise<Proposal | undefined> => {
  try {
    // check common db for cached version
    // only use cache if not in voting state otherwise our votes may be stale
    const cache = await getCacheSnapshotProposal(snapshotId);
    if (cache && cache.status !== STATUS.VOTING) return cache;

    // if not in cache, query snapshot
    const query = gql`
  {
    proposal (
      id: "${snapshotId}"
    ) {
      id
      votes
      type
      start
      end
      state
      choices
      scores
      scores_total
      title
      body
      author
      discussion
      ipfs
      quorum
      space { id }
    }
  }`;
    const gqlResults = await gqlRequest(`${hub}/graphql`, query) as { proposal: SnapshotProposal };
    const sProposal = gqlResults.proposal;
    if (!sProposal) return undefined;

    const proposal = snapshotProposalToProposal(sProposal, sProposal?.quorum || 0);
    // don't need to resummarize if cache proposal is in voting state
    let summary;
    if (!cache?.proposalSummary) summary = await postSummary(proposal, 'proposal');
    await setCacheSnapshotProposal(sProposal, summary);
    return { ...proposal, proposalSummary: summary };
  } catch (e) {
    console.log('Error fetching snapshot proposal', e);
    return undefined;
  }
};
