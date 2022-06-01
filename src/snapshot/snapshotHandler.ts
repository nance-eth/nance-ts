import snapshot from '@snapshot-labs/snapshot.js';
import { request as gqlRequest, gql } from 'graphql-request';
import { ethers } from 'ethers';
import { Proposal } from '../types';
import logger from '../logging';
import { dateToUnixTimeStamp } from '../utils';

export class SnapshotHandler {
  private wallet;
  private provider;
  private snapshot;

  constructor(
    private privateKey: string,
    private providerKey: string,
    private config: any
  ) {
    this.provider = new ethers.providers.AlchemyProvider('mainnet', providerKey);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    const hub = 'https://hub.snapshot.org';
    this.snapshot = new snapshot.Client712(hub);
  }

  async createProposal(proposal: Proposal, startDate: Date, endDate: Date): Promise<string> {
    const startTimeStamp = dateToUnixTimeStamp(startDate);
    const endTimeStamp = dateToUnixTimeStamp(endDate);
    const latestBlock = await this.provider.getBlockNumber();
    const voteHash = await this.snapshot.proposal(this.wallet, this.wallet.address, {
      space: this.config.snapshot.space,
      type: 'single-choice',
      title: `${proposal.proposalId} - ${proposal.title}`,
      body: proposal.markdown,
      discussion: '',
      choices: this.config.snapshot.choices,
      start: startTimeStamp,
      end: endTimeStamp,
      snapshot: latestBlock,
      network: '1',
      strategies: JSON.stringify({}),
      plugins: JSON.stringify({}),
      metadata: JSON.stringify({})
    }).then((response: any) => {
      return response.id;
    }).catch((e) => {
      logger.error(e);
    });
    const voteURL = `
      ${this.config.snapshot.base}/${this.config.snapshot.space}/proposal/${voteHash}
    `;
    return voteURL;
  }
}
