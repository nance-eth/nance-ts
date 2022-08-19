/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
import { NanceConfig, Proposal } from './types';
import logger from './logging';
import { keys } from './keys';
import { DeeplHandler } from './deepl/deeplHandler';
import { GithubProposalHandler } from './github/githubProposalHandler';
import { JSONProposalsToMd } from './github/tableMaker';
import { JuiceboxHandlerV1 } from './juicebox/juiceboxHandlerV1';
import { JuiceboxHandlerV2 } from './juicebox/juiceboxHandlerV2';

export class NanceExtensions {
  translationHandler;
  githubProposalHandler;
  juiceboxHandlerV1;
  juiceboxHandlerV2;

  constructor(
    protected config: NanceConfig
  ) {
    this.translationHandler = new DeeplHandler(keys.DEEPL_KEY);
    this.githubProposalHandler = new GithubProposalHandler(config);
    this.juiceboxHandlerV1 = new JuiceboxHandlerV1(
      config.juicebox.projectId,
      config.juicebox.network
    );
    this.juiceboxHandlerV2 = new JuiceboxHandlerV2(
      config.juicebox.projectId,
      config.juicebox.network
    );
  }

  async pushNewCycle(proposals: Proposal[]) {
    const nextCycle = Number(await this.githubProposalHandler.getCurrentGovernanceCycle()) + 1;
    this.formatProposalsForGithub(nextCycle, proposals);
    const githubProposalFiles = this.stageCycleProposals(proposals);
    const githubCycleDbFiles = this.stageCycleDb(nextCycle, proposals);
    const githubTopDbFiles = await this.stageCompleteDb(proposals);
    const githubGovernanceCycleFile = this.stageGovernanceCycle(nextCycle);
    this.githubProposalHandler.GithubAPI.createCommitOnBranch(
      githubProposalFiles.concat(githubCycleDbFiles, githubTopDbFiles, githubGovernanceCycleFile),
      `GC${nextCycle} push`
    );
  }

  async updateCycle(proposals: Proposal[], update: string) {
    const currentCycle = Number(await this.githubProposalHandler.getCurrentGovernanceCycle());
    this.formatProposalsForGithub(currentCycle, proposals);
    const githubProposalFiles = this.stageCycleProposals(proposals);
    const githubCycleDbFiles = this.stageCycleDb(currentCycle, proposals);
    const githubTopDbFiles = await this.stageCompleteDb(proposals);
    this.githubProposalHandler.GithubAPI.createCommitOnBranch(
      githubProposalFiles.concat(githubCycleDbFiles, githubTopDbFiles),
      `GC${currentCycle} ${update}`
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

  formatProposalsForGithub(cycle: number, proposals: Proposal[]) {
    proposals.forEach((proposal: Proposal) => {
      proposal.governanceCycle = cycle;
      proposal.url = `/GC${proposal.governanceCycle}/${proposal.proposalId}.md`;
      proposal.markdown = `# ${proposal.proposalId} - ${proposal.title}${proposal.markdown}`;
    });
  }

  stageCycleProposals(proposals: Proposal[]) {
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
