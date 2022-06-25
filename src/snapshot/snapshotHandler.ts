import snapshot from '@snapshot-labs/snapshot.js';
import { request as gqlRequest, gql } from 'graphql-request';
import { ethers } from 'ethers';
import { Proposal, VoteResults } from '../types';
import logger from '../logging';
import { dateToUnixTimeStamp } from '../utils';

// console.log = function noConsole() {};

export class SnapshotHandler {
  private wallet;
  private provider;
  private hub;
  private snapshot;

  constructor(
    private privateKey: string,
    private providerKey: string,
    private config: any
  ) {
    this.provider = new ethers.providers.AlchemyProvider('mainnet', providerKey);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    this.hub = 'https://hub.snapshot.org';
    this.snapshot = new snapshot.Client712(this.hub);
  }

  async createProposal(proposal: Proposal, startDate: Date, endDate: Date): Promise<string> {
    const startTimeStamp = dateToUnixTimeStamp(startDate);
    const endTimeStamp = dateToUnixTimeStamp(endDate);
    const latestBlock = await this.provider.getBlockNumber();
    const voteHash = await this.snapshot.proposal(this.wallet, this.wallet.address, {
      space: this.config.snapshot.space,
      type: 'basic',
      title: `${proposal.proposalId} - ${proposal.title}`,
      body: proposal.markdown,
      discussion: '',
      choices: this.config.snapshot.choices,
      start: startTimeStamp,
      end: endTimeStamp,
      snapshot: latestBlock,
      plugins: JSON.stringify({}),
    }).then((response: any) => {
      return response.id;
    }).catch((e) => {
      return Promise.reject(e);
    });
    const voteURL = `
      ${this.config.snapshot.base}/${this.config.snapshot.space}/proposal/${voteHash}
    `;
    return voteURL;
  }

  async getProposalVotes(proposalIds: string[]): Promise<VoteResults[]> {
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
        type
        state
        scores_state
        votes
        scores
        scores_total
      }
    }`;
    const gqlResults = await gqlRequest(`${this.hub}/graphql`, query);
    const results = gqlResults.proposals.map((proposal: any) => {
      return {
        voteProposalId: proposal.id,
        totalVotes: proposal.votes,
        scoresState: proposal.scores_state,
        scores: proposal.choices.reduce((output: any, choice: string, index: number) => {
          return {
            ...output, [choice]: proposal.scores[index]
          };
        }, {})
      };
    });
    return results;
  }
}
