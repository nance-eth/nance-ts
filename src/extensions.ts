/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { NanceConfig, Proposal } from './types';
import logger from './logging';
import { keys } from './keys';
import { DeeplHandler } from './deepl/deeplHandler';
import { GithubProposalHandler } from './github/githubProposalHandler';
import { JSONProposalsToMd } from './github/tableMaker';

// declaration merge
interface Array<T> {
  concat<U>(...items: (U | ConcatArray<U>)[]): (T | U)[]
}

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
    const dbFileChanges = this.githubProposalHandler.cycleDbToFileChanges(
      cycle,
      proposals,
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
    const currentDb = await this.githubProposalHandler.fetchDb() ?? [];
    console.log(currentDb);
    const updatedJSON = currentDb.concat(proposals);
    console.log(updatedJSON);
    const updatedMd = JSONProposalsToMd(updatedJSON);
    return this.githubProposalHandler.topDbToFileChanges(updatedJSON, updatedMd);
  }

  stageGovernanceCycle(cycle: number) {
    return this.githubProposalHandler.newGovernanceCycleFileChange(cycle);
  }
}
