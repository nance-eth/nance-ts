import { request as gqlRequest, gql } from 'graphql-request';
import { Proposal, SnapshotProposal } from "../types";
import { STATUS } from '../constants';
import { uuidGen } from "../utils";

const hub = 'https://hub.snapshot.org';

export const snapshotProposalToProposal = (sProposal: SnapshotProposal, quorum: number): Proposal => {
  let status = STATUS.VOTING;
  if (sProposal.state === 'closed') {
    status = sProposal.scores[0] > sProposal.scores[1] ? STATUS.APPROVED : STATUS.CANCELLED;
  }
  const proposalId = Number(sProposal.title?.match(/\b(\d+)\b/)?.[1]) || null;
  const title = sProposal?.title?.split(': ')[1] || sProposal.title || 'Title Unknown';
  return {
    hash: 'snapshot',
    title,
    body: sProposal.body || 'Body Unknown',
    status,
    authorAddress: sProposal.author,
    proposalId,
    createdTime: new Date(Number(sProposal.start) * 1000),
    discussionThreadURL: sProposal.discussion || '',
    ipfsURL: sProposal.ipfs || '',
    voteURL: sProposal.id,
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

export const getProposalFromSnapshot = async (proposalId: string): Promise<Proposal | undefined> => {
  const query = gql`
  {
    proposal (
      id: "${proposalId}"
    ) {
      id
      votes
      type
      start
      state
      choices
      scores
      scores_total
      title
      body
      author
      discussion
      ipfs
    }
  }`;
  const gqlResults = await gqlRequest(`${hub}/graphql`, query);
  if (!gqlResults.proposal) return undefined;
  return snapshotProposalToProposal(gqlResults.proposal, 0);
};
