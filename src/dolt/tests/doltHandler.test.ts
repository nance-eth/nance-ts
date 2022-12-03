/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
import { oneLine, stripIndent } from 'common-tags';
import { getConfig } from '../../configLoader';
import { Nance } from '../../nance';
import { DoltHandler } from '../doltHandler';

let nance: Nance;

async function setup() {
  const config = await getConfig();
  nance = new Nance(config);
}

async function main() {
  const proposals = await nance.proposalHandler.getDiscussionProposals(true);
  proposals.forEach(async (proposal) => {
    proposal = await nance.proposalHandler.getContentMarkdown(proposal.hash);
    await nance.dProposalHandler.addProposalToDb(proposal);
  });
}

setup().then(() => {
  main();
});
