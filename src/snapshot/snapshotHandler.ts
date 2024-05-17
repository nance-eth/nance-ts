import snapshot from '@snapshot-labs/snapshot.js';
import { request as gqlRequest, gql } from 'graphql-request';
import { ethers } from 'ethers';
import { Proposal, SnapshotVoteSetupOptions, NanceConfig, SnapshotProposal, SnapshotVoteResultsId, SnapshotVoteSettings } from '@nance/nance-sdk';
import { ProposalType } from "@snapshot-labs/snapshot.js/dist/sign/types";
import { dateToUnixTimeStamp, limitLength, myProvider } from '../utils';
import { snapshotProposalToProposal } from './snapshotProposals';
import { keys } from '../keys';

export class SnapshotHandler {
  private wallet;
  private provider;
  private hub;
  private snapshot;

  constructor(
    private privateKey: string,
    private config: NanceConfig
  ) {
    const { network } = config.juicebox;
    this.provider = myProvider(network);
    this.wallet = (privateKey === '') ? ethers.Wallet.createRandom() : new ethers.Wallet(privateKey, this.provider);

    this.hub = 'https://hub.snapshot.org';
    this.snapshot = new snapshot.Client712(this.hub);
  }

  async createProposal(proposal: Proposal, startDate: Date, endDate: Date, options: SnapshotVoteSetupOptions, jitter: number): Promise<string> {
    const startTimeStamp = dateToUnixTimeStamp(startDate);
    const endTimeStamp = dateToUnixTimeStamp(endDate);
    const latestBlock = await this.provider.getBlockNumber();
    if (!proposal.body) return Promise.reject(Error('Proposal body is required'));
    const snapProposal = {
      space: this.config.snapshot.space,
      type: options.type as ProposalType,
      title: `${this.config.proposalIdPrefix}${proposal.proposalId}: ${proposal.title}`,
      body: limitLength(proposal.body, 10_000),
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
    return voteHash;
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

  async getAllProposalsByScore(gt?: number): Promise<Proposal[]> {
    const query = gql`
    {
      proposals (
        where: {
          space: "${this.config.snapshot.space}",
          ${gt ? `end_gt: ${gt},` : null}
        }
        first: 1000
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
      }
    }`;
    const gqlResults = await gqlRequest(`${this.hub}/graphql`, query, undefined, { "x-api-key": keys.SNAPSHOT_API_KEY });
    let results = gqlResults.proposals.sort((a: SnapshotProposal, b: SnapshotProposal) => {
      return b.scores_total - a.scores_total;
    });
    results = results.map((result: SnapshotProposal) => { return snapshotProposalToProposal(result, this.config.snapshot.minTokenPassingAmount); });
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
