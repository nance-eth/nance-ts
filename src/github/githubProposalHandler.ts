import { oneLine, oneLineTrim, stripIndents } from 'common-tags';
import { NanceConfig, Proposal } from '../types';
import logger from '../logging';
import { keys } from '../keys';
import { GithubHandler } from './githubHandler';

export class GithubProposalHandler {
  githubHandler;
  protected database = 'DATABASE.json';

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

  async fetchDb(): Promise<Proposal[]> {
    return this.githubHandler.getContent(this.database).then(async (content) => {
      return JSON.parse(content).map((data: any) => {
        return this.toProposal(data);
      });
    }).catch((e) => {
      Promise.reject(e);
    });
  }

  async getVoteProposals() {
    return this.fetchDb().then((db) => {
      return db.filter((proposal: Proposal) => {
        return proposal.status === 'Voting';
      });
    });
  }
}
