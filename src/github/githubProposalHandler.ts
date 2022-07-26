import { oneLine, oneLineTrim, stripIndents } from 'common-tags';
import { NanceConfig, Proposal } from '../types';
import logger from '../logging';
import { keys } from '../keys';
import { GithubHandler } from './githubHandler';
import { P } from '../const';

export class GithubProposalHandler {
  githubHandler;
  protected database = 'DATABASE.json';
  protected databaseCache: Proposal[] = [];

  constructor(
    protected config: NanceConfig
  ) {
    this.githubHandler = new GithubHandler(
      keys.GITHUB_KEY,
      this.config.github.user,
      this.config.github.repo
    );
  }

  private toProposal(unconvertedProposal: any): Proposal {
    const proposalURL = oneLineTrim`https://github.com
      /${this.config.github.user}
      /${this.config.github.repo}
      /blob/main
      /GC${unconvertedProposal[this.config.github.propertyKeys.governanceCycle]}
      /${unconvertedProposal[this.config.github.propertyKeys.proposalId]}.md`;
    return {
      hash: '',
      title: unconvertedProposal[this.config.github.propertyKeys.title],
      markdown: '',
      url: proposalURL,
      category: unconvertedProposal[this.config.github.propertyKeys.category],
      status: unconvertedProposal[this.config.github.propertyKeys.status],
      proposalId: unconvertedProposal[this.config.github.propertyKeys.proposalId],
      governanceCycle: unconvertedProposal[this.config.github.propertyKeys.governanceCycle],
      discussionThreadURL: unconvertedProposal[this.config.github.propertyKeys.discussionThread],
      ipfsURL: unconvertedProposal[this.config.github.propertyKeys.ipfs],
      voteURL: unconvertedProposal[this.config.github.propertyKeys.vote]
    };
  }

  async fetchDb() {
    return this.githubHandler.getContent(this.database).then((db) => {
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
    console.log(`ID ${proposalId} => ${updateProperty}: ${updateValue}`);
  }

  pushMetaData() {
    const stringifyDB = JSON.stringify(this.databaseCache, null, 4);
    this.githubHandler.updateContent(this.database, stringifyDB).then(() => {
      this.databaseCache = [];
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

  // eslint-disable-next-line class-methods-use-this
  getContentMarkdown() {
    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  appendProposal() {
    const stub = this.database;
    return '';
  }

  async updateStatusVoting(proposalHash: string) {
    this.updateMetaData(
      proposalHash,
      P.STATUS,
      this.config.github.propertyKeys.statusVoting
    );
  }

  async updateStatusApproved(proposalHash: string) {
    await this.updateMetaData(
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
    this.updateMetaData(
      proposal.proposalId,
      P.VOTE_URL,
      proposal.voteURL
    );
    this.updateMetaData(
      proposal.proposalId,
      P.IPFS_URL,
      proposal.ipfsURL
    );
  }
}
