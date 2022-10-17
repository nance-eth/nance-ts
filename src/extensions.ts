/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
import { GithubFileChange, Proposal } from './types';
import logger from './logging';
import { keys } from './keys';
import { DeeplHandler } from './deepl/deeplHandler';
import { GithubProposalHandler } from './github/githubProposalHandler';
import { JSONProposalsToMd } from './github/tableMaker';
import { Nance } from './nance';

export class NanceExtensions {
  translationHandler;
  githubProposalHandler;

  constructor(
    protected nance: Nance
  ) {
    this.translationHandler = new DeeplHandler(keys.DEEPL_KEY);
    this.githubProposalHandler = new GithubProposalHandler(nance.config);
  }

  async pushNewCycle(proposals: Proposal[]) {
    const nextCycle = Number(await this.githubProposalHandler.getCurrentGovernanceCycle()) + 1;
    this.formatProposalsForGithub(nextCycle, proposals);
    const githubProposalFiles = this.stageCycleProposals(proposals);
    const githubCycleDbFiles = this.stageCycleDb(nextCycle, proposals);
    const githubTopDbFiles = await this.stageCompleteDb(proposals);
    const githubGovernanceCycleFile = this.stageGovernanceCycle(nextCycle);
    let allGithubChanges = githubProposalFiles.concat(githubCycleDbFiles, githubTopDbFiles, githubGovernanceCycleFile);
    if (this.nance.config.translation) {
      const githubProposalTransaltionFiles = this.stageTranslationProposals(
        await this.translateProposals(proposals)
      );
      allGithubChanges = allGithubChanges.concat(githubProposalTransaltionFiles);
    }
    this.githubProposalHandler.GithubAPI.createCommitOnBranch(
      allGithubChanges,
      `GC${nextCycle} push`
    );
  }

  async updateCycle(proposals: Proposal[], update: string) {
    const currentCycle = Number(await this.githubProposalHandler.getCurrentGovernanceCycle());
    this.formatProposalsForGithub(currentCycle, proposals);
    const githubCycleDbFiles = this.stageCycleDb(currentCycle, proposals);
    const githubTopDbFiles = await this.stageCompleteDb(proposals);
    this.githubProposalHandler.GithubAPI.createCommitOnBranch(
      githubCycleDbFiles.concat(githubTopDbFiles),
      `GC${currentCycle} ${update}`
    );
    this.nance.proposalHandler.incrementGovernanceCycle();
  }

  stageCycleDb(cycle: number, proposals: Proposal[]) {
    const mdTable = JSONProposalsToMd(proposals);
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
      proposal.body = `# ${proposal.proposalId} - ${proposal.title}${proposal.body}`;
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
    logger.info(`${this.nance.config.name}: translateProposals() begin...`);
    const nextCycle = Number(await this.githubProposalHandler.getCurrentGovernanceCycle()) + 1;
    return Promise.all(proposals.map(async (proposal) => {
      proposal.governanceCycle = nextCycle;
      const translation = await this.translationHandler.translate(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        proposal.body!.split('```\n\n')[1], // cut out proposal header
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.nance.config.translation!.targetLanguage
      );
      proposal.translation = {
        body: translation.replace('∮∮', '## '),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        language: this.nance.config.translation!.targetLanguage
      };
    })).then(() => {
      logger.info(`${this.nance.config.name}: translateProposals() complete`);
      return proposals;
    });
  }

  stageTranslationProposals(proposals: Proposal[]) {
    return this.githubProposalHandler.translatedProposalsToGithubFileChanges(proposals);
  }
}
