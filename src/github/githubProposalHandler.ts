import { oneLineTrim } from 'common-tags';
import { GithubFileChange, NanceConfig, Proposal } from '../types';
import logger from '../logging';
import { keys } from '../keys';
import { GithubAPI } from './githubAPI';
import { P } from '../const';

const GITHUB = 'https://github.com';

export class GithubProposalHandler {
  GithubAPI;
  protected databasePath = 'DATABASE.json';
  protected currentGovernanceCyclePath = 'CURRENT_GOVERNANCE_CYCLE';
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

  static stageProposals(proposals: Proposal[]): GithubFileChange[] {
    return proposals.map((proposal: Proposal) => {
      return {
        path: `${proposal.governanceCycle}/${proposal.proposalId}.md`,
        contents: proposal.markdown!
      };
    });
  }

  githubProposalURL(proposal: Proposal) {
    return oneLineTrim`
      ${GITHUB}/${this.config.github.user}/${this.config.github.repo}/blob/main/
      GC${proposal.governanceCycle}/${proposal.proposalId}.md`;
  }

  async fetchDb() {
    return this.GithubAPI.getContent(this.databasePath).then((db) => {
      this.databaseCache = JSON.parse(db);
    }).catch((e) => {
      Promise.reject(e);
    });
  }

  async updateMetaDataCache(proposalHash: string, updateProperty: string, updateValue: string) {
    // TODO: ability to modify multiple propoerties and values
    this.databaseCache.forEach((proposal: Proposal, index: number) => {
      if (proposal.proposalId === proposalHash) {
        this.databaseCache[index] = { ...proposal, [updateProperty]: updateValue };
      }
    });
  }

  async getCurrentGovernanceCycle() {
    return this.GithubAPI.getContent(this.currentGovernanceCyclePath).then((content) => {
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
      this.updateMetaDataCache(
        proposal.hash,
        P.STATUS,
        this.config.github.propertyKeys.statusTemperatureCheck
      ),
      this.updateMetaDataCache(
        proposal.hash,
        P.STATUS,
        this.config.github.propertyKeys.statusTemperatureCheck
      )
    ]);
  }

  async updateStatusVoting(proposalHash: string) {
    this.updateMetaDataCache(
      proposalHash,
      P.STATUS,
      this.config.github.propertyKeys.statusVoting
    );
  }

  async updateStatusApproved(proposalHash: string) {
    this.updateMetaDataCache(
      proposalHash,
      P.STATUS,
      this.config.github.propertyKeys.statusApproved
    );
  }

  async updateStatusCancelled(proposalHash: string) {
    this.updateMetaDataCache(
      proposalHash,
      P.STATUS,
      this.config.github.propertyKeys.statusCancelled
    );
  }

  async updateVoteAndIPFS(proposal: Proposal) {
    Promise.all([
      this.updateMetaDataCache(
        proposal.hash,
        P.VOTE_URL,
        proposal.voteURL
      ),
      this.updateMetaDataCache(
        proposal.hash,
        P.IPFS_URL,
        proposal.ipfsURL
      )
    ]);
  }
}
