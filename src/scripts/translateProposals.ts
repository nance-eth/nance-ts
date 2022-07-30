import {
  sleep
} from '../utils';
import { NanceExtensions } from '../extensions';
import { getConfig } from '../configLoader';
import { Nance } from '../nance';
import logger from '../logging';
import { NanceConfig } from '../types';

let config: NanceConfig;
const pageId = '';

async function main() {
  config = await getConfig();
  const nanceExt = new NanceExtensions(config);
  const nance = new Nance(config);
  await sleep(2000);
  const nextCycle = Number(await nanceExt.githubProposalHandler.getCurrentGovernanceCycle()) + 1;
  const temperatureCheckProposals = await nance.proposalHandler.getTemperatureCheckProposals();
  Promise.all(temperatureCheckProposals.map(async (proposal) => {
    proposal.governanceCycle = nextCycle;
    proposal.markdown = await nance.proposalHandler.getContentMarkdown(proposal.hash);
    const translation = await nanceExt.translationHandler.translate(proposal.markdown, config.translation.targetLanguage);
    proposal.translation = {
      markdown: translation,
      language: config.translation.targetLanguage
    }
  })).then(() => {
    logger.info(temperatureCheckProposals);
    const translationPush = nanceExt.stageTranslationProposals(temperatureCheckProposals);
    nanceExt.githubProposalHandler.GithubAPI.createCommitOnBranch(translationPush, `GC${nextCycle} tranlations`)
  });
}

main();
