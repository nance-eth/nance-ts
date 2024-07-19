import { request as gqlRequest, gql } from 'graphql-request';
import { Proposal, ProposalPacket, ProposalStatus, SnapshotProposal } from "@nance/nance-sdk";
import { getCacheSnapshotProposal, setCacheSnapshotProposal } from "../dolt/doltCommon";
import { postSummary } from "../nancearizer";
import { uuidGen } from "../utils";

const hub = 'https://hub.snapshot.org';

export const snapshotProposalToProposal = (sProposal: SnapshotProposal, quorum: number): ProposalPacket => {
  let status = "Voting";
  if (sProposal.state === 'closed') {
    status = sProposal.scores[0] > sProposal.scores[1] ? "Approved" : "Cancelled";
  }
  const cleanedTitle = sProposal?.title?.replace(/^([A-Z]+-\d+): /, '').trim();
  const proposalIdMatch = sProposal?.title?.match(/^([A-Z]+-(\d+)): /);
  const proposalId = proposalIdMatch ? Number(proposalIdMatch[2]) : undefined;
  console.log('proposalId', proposalId);
  return {
    uuid: uuidGen(),
    title: cleanedTitle || 'Title Unknown',
    body: sProposal.body || 'Body Unknown',
    status: status as ProposalStatus,
    proposalId,
    authorAddress: sProposal.author,
    createdTime: new Date(Number(sProposal.start) * 1000).toISOString(),
    lastEditedTime: new Date(Number(sProposal.end) * 1000).toISOString(),
    discussionThreadURL: sProposal.discussion || '',
    ipfsURL: sProposal.ipfs || '',
    voteURL: sProposal.id,
    voteSetup: {
      type: sProposal.type,
      choices: sProposal.choices,
    },
    actions: [],
    voteResults: {
      votes: sProposal.votes,
      scores: sProposal.scores,
      choices: sProposal.choices,
      scoresTotal: sProposal.scores_total,
      quorumMet: sProposal.scores_total >= quorum,
    },
    proposalInfo: {
      snapshotSpace: sProposal?.space?.id || '',
      proposalIdPrefix: '',
      minTokenPassingAmount: sProposal.quorum || 0,
      nextProposalId: 0,
    }
  };
};

export const fetchSnapshotProposal = async (snapshotId: string): Promise<ProposalPacket | undefined> => {
  try {
    // check common db for cached version
    // only use cache if not in voting state otherwise our votes may be stale
    const cache = await getCacheSnapshotProposal(snapshotId);
    if (cache && cache.status !== "Voting") return cache;

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
    sProposal.body = sProposal?.body?.replace(/ipfs:\/\/([a-zA-Z0-9]+)/g, 'https://snapshot.4everland.link/ipfs/$1');
    const proposal = snapshotProposalToProposal(sProposal, sProposal?.quorum || 0);
    // don't need to resummarize if cache proposal is in voting state
    let summary = cache?.proposalSummary;
    if (!summary) summary = await postSummary(proposal, 'proposal');
    await setCacheSnapshotProposal(sProposal, summary);
    return { ...proposal, proposalSummary: summary };
  } catch (e) {
    console.log('Error fetching snapshot proposal', e);
    return undefined;
  }
};
