import snapshot from '@snapshot-labs/snapshot.js';
import { request as gqlRequest, gql } from 'graphql-request';
import { ethers } from 'ethers';
import { Proposal, InternalVoteResults, SnapshotVoteOptions, NanceConfig } from '../types';
import { dateToUnixTimeStamp, myProvider } from '../utils';

// console.log = function noConsole() {};

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

  async createProposal(proposal: Proposal, startDate: Date, endDate: Date, options?: SnapshotVoteOptions): Promise<string> {
    const startTimeStamp = dateToUnixTimeStamp(startDate);
    const endTimeStamp = dateToUnixTimeStamp(endDate);
    const latestBlock = await this.provider.getBlockNumber();
    const snapProposal = {
      space: this.config.snapshot.space,
      type: (options?.type === '') ? 'basic' : options?.type ?? 'basic',
      title: `${proposal.proposalId} - ${proposal.title}`,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      body: proposal.body!,
      discussion: proposal.discussionThreadURL,
      choices: (options?.choices && options?.choices.length > 1) ? options?.choices : this.config.snapshot.choices,
      start: startTimeStamp,
      end: endTimeStamp,
      snapshot: latestBlock,
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

  async getProposalVotes(proposalIds: string[]): Promise<InternalVoteResults[]> {
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
