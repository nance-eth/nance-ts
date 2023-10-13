import snapshot from '@snapshot-labs/snapshot.js';
import { request as gqlRequest, gql } from 'graphql-request';
import { ethers } from 'ethers';
import { Proposal, SnapshotVoteOptions, NanceConfig, SnapshotProposal, SnapshotVoteResultsId, SnapshotVoteSettings } from '../types';
import { dateToUnixTimeStamp, myProvider, uuidGen } from '../utils';
import { STATUS } from '../constants';

const snapshotProposalToProposal = (sProposal: SnapshotProposal, quorum: number): Proposal => {
  let status = STATUS.VOTING;
  if (sProposal.state === 'closed') {
    status = sProposal.scores[0] > sProposal.scores[1] ? STATUS.APPROVED : STATUS.CANCELLED;
  }
  const proposalId = Number(sProposal.title?.match(/.*-(\d+)/)?.[1]) || null;
  return {
    hash: uuidGen(),
    title: sProposal.title || 'Title Unknown',
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

export class SnapshotHandler {
  private wallet;
  private provider;
  private hub;
  private snapshot;

  constructor(
    private privateKey: string,
    private config: NanceConfig
  ) {
    this.provider = myProvider('mainnet');
    this.wallet = (privateKey === '') ? ethers.Wallet.createRandom() : new ethers.Wallet(privateKey, this.provider);

    this.hub = 'https://hub.snapshot.org';
    this.snapshot = new snapshot.Client712(this.hub);
  }

  async createProposal(proposal: Proposal, startDate: Date, endDate: Date, options: SnapshotVoteOptions, jitter: number): Promise<string> {
    const startTimeStamp = dateToUnixTimeStamp(startDate);
    const endTimeStamp = dateToUnixTimeStamp(endDate);
    const latestBlock = await this.provider.getBlockNumber();
    const snapProposal = {
      space: this.config.snapshot.space,
      type: options.type,
      title: `${this.config.proposalIdPrefix}${proposal.proposalId} - ${proposal.title}`,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      body: proposal.body!,
      discussion: proposal.discussionThreadURL,
      choices: options.choices,
      start: startTimeStamp,
      end: endTimeStamp,
      snapshot: latestBlock - jitter,
      plugins: JSON.stringify({}),
    };
    const voteHash = await this.snapshot.proposal(this.wallet, this.wallet.address, snapProposal).then((response: any) => {
      return response.id;
    }).catch((e) => {
      return Promise.reject(e);
    });
    const voteURL = `${this.config.snapshot.base}/${this.config.snapshot.space}/proposal/${voteHash}`;
    return voteURL;
  }

  async getProposalVotes(proposalIds: string[]): Promise<SnapshotVoteResultsId[]> {
    const query = gql`
    {
      proposals (
        where: {
          space: "${this.config.snapshot.space}"
          id_in: [${proposalIds}]
        }
      ) {
        id
        choices
        scores_state
        votes
        scores
        scores_total
      }
    }`;
    const results = await gqlRequest(`${this.hub}/graphql`, query) as { proposals: SnapshotVoteResultsId[] };
    return results.proposals;
  }
  async getAllProposalsByScore(forSync = false): Promise<Proposal[]> {
    const query = gql`
    {
      proposals (
        where: {
          space: "${this.config.snapshot.space}"
        }
        first: 5
      ) {
        id
        votes
        type
        start
        state
        choices
        scores
        scores_total
        ${(forSync) ? 'title\nbody\nauthor\ndiscussion\nipfs' : ''}
      }
    }`;
    const gqlResults = await gqlRequest(`${this.hub}/graphql`, query);
    let results = gqlResults.proposals.sort((a: SnapshotProposal, b: SnapshotProposal) => {
      return b.scores_total - a.scores_total;
    });
    results = (forSync) ? results.map((result: SnapshotProposal) => { return snapshotProposalToProposal(result, this.config.snapshot.minTokenPassingAmount); }) : results;
    return results;
  }

  async getVotingSettings(): Promise<SnapshotVoteSettings> {
    const query = gql`
    {
      space(id: "${this.config.snapshot.space}") {
        voting {
          quorum
          period
          type
          delay
        }
      }
    }`;
    const results = await gqlRequest(`${this.hub}/graphql`, query);
    return results.space.voting;
  }
}
