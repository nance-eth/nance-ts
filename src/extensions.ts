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

  async pushProposals(proposals: Proposal[]) {
    const nextGovernanceCycle = Number(
      await this.githubProposalHandler.getCurrentGovernanceCycle()
    ) + 1;
    proposals.forEach((proposal: Proposal) => {
      proposal.governanceCycle = nextGovernanceCycle;
      proposal.url = this.githubProposalHandler.githubProposalURL(proposal);
      this.githubProposalHandler.pushProposal(proposal);
    });
  }
}
