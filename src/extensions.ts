/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { NanceConfig, Proposal } from './types';
import logger from './logging';
import { keys } from './keys';
import { DeeplHandler } from './deepl/deeplHandler';
import { GithubProposalHandler } from './github/githubProposalHandler';

export class NanceExtensions {
  translationHandler;
  githubProposalHandler;

  constructor(
    protected config: NanceConfig
  ) {
    this.translationHandler = new DeeplHandler(keys.DEEPL_KEY);
    this.githubProposalHandler = new GithubProposalHandler(config);
  }

  async pushProposalsAndDatabase(proposals: Proposal[]) {
    const nextGovernanceCycle = Number(
      await this.githubProposalHandler.getCurrentGovernanceCycle()
    ) + 1;
    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      proposal.governanceCycle = nextGovernanceCycle;
      proposal.url = this.githubProposalHandler.githubProposalURL(proposal);
    }
    console.log(proposals);
  }
}
