/* eslint-disable no-param-reassign */
import { NanceConfig, Proposal } from './types';
import { Nance } from './nance';
import logger from './logging';
import { keys } from './keys';
import { DeeplHandler } from './deepl/deeplHandler';
import { GithubHandler } from './github/githubHandler';

export class NanceExtensions {
  translationHandler;
  githubHandler;

  constructor(
    protected config: NanceConfig
  ) {
    this.translationHandler = new DeeplHandler(keys.DEEPL_KEY);
    this.githubHandler = new GithubHandler(
      keys.GITHUB_KEY,
      this.config.translation.storage.user,
      this.config.translation.storage.repo
    );
  }

  async getGitGovernanceCycle() {
    return this.githubHandler.getContent('CURRENT_GOVERNANCE_CYCLE').then((response) => {
      return response;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async translateAndStoreProposals(proposals: Proposal[]) {
    logger.info(`${this.config.name}: translateProposals() begin...`);
    Promise.all(proposals.map(async (proposal) => {
      const nextGovernanceVersion = Number(await this.getGitGovernanceCycle()) + 1;
      const mdString = proposal.markdown;
      const translationLanguage = this.config.translation.targetLanguage;
      const translatedMdString = await this.translationHandler.translate(
        mdString,
        translationLanguage
      );
      proposal.translationURL = await this.githubHandler.pushContent(
        `GC${nextGovernanceVersion}/translation/${translationLanguage}/${proposal.proposalId}_${translationLanguage}.md`,
        translatedMdString
      );
    })).then(() => {
      logger.info(`${this.config.name}: translateProposals() complete`);
    }).catch((e) => {
      logger.error(`${this.config.name}: translateProposals() error:`);
      logger.error(e);
    });
  }
}
