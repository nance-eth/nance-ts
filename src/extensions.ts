/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { NanceConfig, Proposal } from './types';
import logger from './logging';
import { keys } from './keys';
import { DeeplHandler } from './deepl/deeplHandler';
import { GithubProposalHandler } from './github/githubProposalHandler';
import { JSONProposalsToMd } from './github/tableMaker';

export class NanceExtensions {
  translationHandler;
  githubProposalHandler;

  constructor(
    protected config: NanceConfig
  ) {
    this.translationHandler = new DeeplHandler(keys.DEEPL_KEY);
    this.githubProposalHandler = new GithubProposalHandler(config);
  }

  async pushNewCycle(proposals: Proposal[]) {
    const nextCycle = Number(await this.githubProposalHandler.getCurrentGovernanceCycle()) + 1;
    const githubProposalFiles = this.stageCycleProposals(nextCycle, proposals);
    const githubCycleDbFiles = this.stageCycleDb(nextCycle, proposals);
    const githubTopDbFiles = await this.stageCompleteDb(proposals);
    const githubGovernanceCycleFile = this.stageGovernanceCycle(nextCycle);
    this.githubProposalHandler.GithubAPI.createCommitOnBranch(
      githubProposalFiles.concat(githubCycleDbFiles, githubTopDbFiles, githubGovernanceCycleFile),
      `GC${nextCycle} updates`
    );
  }

  stageCycleDb(cycle: number, proposals: Proposal[]) {
    const mdTable = JSONProposalsToMd(proposals);
    proposals.forEach((proposal: Proposal) => {
      delete proposal.markdown;
    });
    const proposalStore = this.githubProposalHandler.proposalsToProposalStore(proposals);
    const dbFileChanges = this.githubProposalHandler.cycleDbToFileChanges(
      cycle,
      proposalStore,
      mdTable
    );
    return dbFileChanges;
  }

  stageCycleProposals(cycle: number, proposals: Proposal[]) {
    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      proposal.governanceCycle = cycle;
      proposal.url = `/GC${proposal.governanceCycle}/${proposal.proposalId}.md`;
    }
    return this.githubProposalHandler.proposalsToGithubFileChanges(proposals);
  }

  async stageCompleteDb(proposals: Proposal[]) {
    const currentDb = await this.githubProposalHandler.fetchDb() ?? {};
    const newEntries = this.githubProposalHandler.proposalsToProposalStore(proposals);
    const updatedJSON = {
      ...currentDb,
      ...newEntries
    };
    const updatedMd = JSONProposalsToMd(Object.values(updatedJSON));
    return this.githubProposalHandler.topDbToFileChanges(updatedJSON, updatedMd);
  }

  stageGovernanceCycle(cycle: number) {
    return this.githubProposalHandler.newGovernanceCycleFileChange(cycle);
  }

  async pushTranslatedProposals(proposals: Proposal[]) {
    const githubTranslatedProposals = this.stageTranslationProposals(proposals);
    const nextCycle = Number(await this.githubProposalHandler.getCurrentGovernanceCycle()) + 1;
    this.githubProposalHandler.GithubAPI.createCommitOnBranch(
      githubTranslatedProposals,
      `GC${nextCycle} tranlations`
    );
  }

  async translateProposals(proposals: Proposal[]): Promise<Proposal[]> {
    logger.info(`${this.config.name}: translateProposals() begin...`);
    const nextCycle = Number(await this.githubProposalHandler.getCurrentGovernanceCycle()) + 1;
    return Promise.all(proposals.map(async (proposal) => {
      proposal.governanceCycle = nextCycle;
      const translation = await this.translationHandler.translate(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        proposal.markdown!,
        this.config.translation.targetLanguage
      );
      proposal.translation = {
        markdown: translation,
        language: this.config.translation.targetLanguage
      };
    })).then(() => {
      return proposals;
    });
  }

  stageTranslationProposals(proposals: Proposal[]) {
    return this.githubProposalHandler.translatedProposalsToGithubFileChanges(proposals);
  }
}
