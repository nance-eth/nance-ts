/* eslint-disable no-param-reassign */
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
  protected mdPath = 'DATABASE.md';
  protected currentGovernanceCyclePath = 'CURRENT_GOVERNANCE_CYCLE';
  databaseCache: Proposal[] = [];

  constructor(
    protected config: NanceConfig
  ) {
    this.GithubAPI = new GithubAPI(
      keys.GITHUB_KEY,
      this.config.github.user,
      this.config.github.repo
    );
  }

  // eslint-disable-next-line class-methods-use-this
  proposalsToGithubFileChanges(proposals: Proposal[]): GithubFileChange[] {
    return proposals.map((proposal: Proposal) => {
      return {
        path: `GC${proposal.governanceCycle}/${proposal.proposalId}.md`,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        contents: proposal.markdown!
      };
    });
  }

  // eslint-disable-next-line class-methods-use-this
  translatedProposalsToGithubFileChanges(proposals: Proposal[]): GithubFileChange[] {
    return proposals.map((proposal: Proposal) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { language } = proposal.translation!;
      return {
        path: `GC${proposal.governanceCycle}/translation/${language}/${proposal.proposalId}_${language}.md`,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        contents: proposal.translation!.markdown!
      };
    });
  }

  // eslint-disable-next-line class-methods-use-this
  cycleDbToFileChanges(cycle: number, proposals: Proposal[], mdTable: string): GithubFileChange[] {
    return ([
      {
        path: `GC${cycle}/DATABASE.json`,
        contents: JSON.stringify(proposals, null, 4)
      },
      {
        path: `GC${cycle}/README.md`,
        contents: mdTable
      }
    ]);
  }

  topDbToFileChanges(proposals: Proposal[], mdTable: string): GithubFileChange[] {
    return ([
      {
        path: this.databasePath,
        contents: JSON.stringify(proposals, null, 4)
      },
      {
        path: this.mdPath,
        contents: mdTable
      }
    ]);
  }

  newGovernanceCycleFileChange(newGovernanceCyle: number): GithubFileChange {
    return (
      {
        path: this.currentGovernanceCyclePath,
        contents: String(newGovernanceCyle)
      }
    );
  }

  async fetchDb() {
    return this.GithubAPI.getContent(this.databasePath).then((db) => {
      this.databaseCache = JSON.parse(db);
      return this.databaseCache;
    }).catch((e) => {
      Promise.reject(e);
    });
  }

  updateMetaDataCache(proposal: Proposal) {
    // TODO: make less bad
    this.databaseCache = this.databaseCache.map((dbProposal: Proposal) => {
      if (dbProposal.hash === proposal.hash) {
        delete proposal.markdown; // dont want to store this in JSON DB
        return { ...dbProposal, ...proposal };
      }
      return dbProposal;
    });
  }

  async getCurrentGovernanceCycle() {
    return this.GithubAPI.getContent(this.currentGovernanceCyclePath).then((content) => {
      return content;
    }).catch((e) => {
      Promise.reject(e);
    });
  }

  async getCycleDirectories() {
    return this.GithubAPI.getDirectories().then((content) => {
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

  // async updateStatusTemperatureCheckAndProposalId(proposal: Proposal) {
  //   Promise.all([
  //     this.updateMetaDataCache(
  //       proposal.hash,
  //       P.STATUS,
  //       this.config.github.propertyKeys.statusTemperatureCheck
  //     ),
  //     this.updateMetaDataCache(
  //       proposal.hash,
  //       P.STATUS,
  //       this.config.github.propertyKeys.statusTemperatureCheck
  //     )
  //   ]);
  // }

  // async updateStatusVoting(proposalHash: string) {
  //   this.updateMetaDataCache(
  //     proposalHash,
  //     P.STATUS,
  //     this.config.github.propertyKeys.statusVoting
  //   );
  // }

  // async updateStatusApproved(proposalHash: string) {
  //   this.updateMetaDataCache(
  //     proposalHash,
  //     P.STATUS,
  //     this.config.github.propertyKeys.statusApproved
  //   );
  // }

  // async updateStatusCancelled(proposalHash: string) {
  //   this.updateMetaDataCache(
  //     proposalHash,
  //     P.STATUS,
  //     this.config.github.propertyKeys.statusCancelled
  //   );
  // }

  // async updateVoteAndIPFS(proposal: Proposal) {
  //   Promise.all([
  //     this.updateMetaDataCache(
  //       proposal.hash,
  //       P.VOTE_URL,
  //       proposal.voteURL
  //     ),
  //     this.updateMetaDataCache(
  //       proposal.hash,
  //       P.IPFS_URL,
  //       proposal.ipfsURL
  //     )
  //   ]);
  // }
}
