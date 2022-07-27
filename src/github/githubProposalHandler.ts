import { oneLineTrim } from 'common-tags';
import { NanceConfig, Proposal } from '../types';
import logger from '../logging';
import { keys } from '../keys';
import { GithubAPI } from './githubAPI';
import { P } from '../const';

const GITHUB = 'https://github.com';

export class GithubProposalHandler {
  GithubAPI;
  protected database = 'DATABASE.json';
  protected currentGovernanceCycle = 'CURRENT_GOVERNANCE_CYCLE';
  protected databaseCache: Proposal[] = [];

  constructor(
    protected config: NanceConfig
  ) {
    this.GithubAPI = new GithubAPI(
      keys.GITHUB_KEY,
      this.config.github.user,
      this.config.github.repo
    );
  }

  githubProposalURL(proposal: Proposal) {
    return oneLineTrim`
      ${GITHUB}/${this.config.github.user}/${this.config.github.repo}/blob/main/
      GC${proposal.governanceCycle}/${proposal.proposalId}.md`;
  }

  async fetchDb() {
    return this.GithubAPI.getContent(this.database).then((db) => {
      this.databaseCache = JSON.parse(db);
    }).catch((e) => {
      Promise.reject(e);
    });
  }

  async updateMetaData(proposalId: string, updateProperty: string, updateValue: string) {
    this.databaseCache.forEach((proposal: Proposal, index: number) => {
      if (proposal.proposalId === proposalId) {
        this.databaseCache[index] = { ...proposal, [updateProperty]: updateValue };
      }
    });
  }

  async pushMetaData() {
    const stringifyDB = JSON.stringify(this.databaseCache, null, 4);
    this.GithubAPI.updateContent(this.database, stringifyDB).then(() => {
      this.databaseCache = [];
    });
  }

  async pushProposal(proposal: Proposal) {
    const proposalPath = `GC${proposal.governanceCycle}/${proposal.proposalId}`;
    if (!proposal.markdown) { return; }
    this.GithubAPI.pushContent(proposalPath, proposal.markdown);
  }

  async getCurrentGovernanceCycle() {
    return this.GithubAPI.getContent(this.currentGovernanceCycle).then((content) => {
      return content;
    }).catch((e) => {
      Promise.reject(e);
    });
  }

  async getTemperatureCheckProposals() {
    await this.fetchDb();
    return this.databaseCache.filter((proposal) => {
      return proposal.status === this.config.github.propertyKeys.statusTemperatureCheck;
    });
  }

  async getVoteProposals() {
    await this.fetchDb();
    return this.databaseCache.filter((proposal) => {
      return proposal.status === this.config.github.propertyKeys.statusVoting;
    });
  }

  async updateStatusTemperatureCheckAndProposalId(proposal: Proposal) {
    Promise.all([
      this.updateMetaData(
        proposal.hash,
        P.STATUS,
        this.config.github.propertyKeys.statusTemperatureCheck
      ),
      this.updateMetaData(
        proposal.hash,
        P.STATUS,
        this.config.github.propertyKeys.statusTemperatureCheck
      )
    ]);
  }

  async updateStatusVoting(proposalHash: string) {
    this.updateMetaData(
      proposalHash,
      P.STATUS,
      this.config.github.propertyKeys.statusVoting
    );
  }

  async updateStatusApproved(proposalHash: string) {
    this.updateMetaData(
      proposalHash,
      P.STATUS,
      this.config.github.propertyKeys.statusApproved
    );
  }

  async updateStatusCancelled(proposalHash: string) {
    this.updateMetaData(
      proposalHash,
      P.STATUS,
      this.config.github.propertyKeys.statusCancelled
    );
  }

  async updateVoteAndIPFS(proposal: Proposal) {
    Promise.all([
      this.updateMetaData(
        proposal.hash,
        P.VOTE_URL,
        proposal.voteURL
      ),
      this.updateMetaData(
        proposal.hash,
        P.IPFS_URL,
        proposal.ipfsURL
      )
    ]);
  }
}
