/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
import { oneLine, stripIndent } from 'common-tags';
import { getConfig } from '../../configLoader';
import { Nance } from '../../nance';
import { sleep } from '../../utils';
import { DoltHandler } from '../doltHandler';

async function main() {
  // const proposals = await nance.proposalHandler.getDiscussionProposals(true);
  // proposals.forEach(async (proposal) => {
  //   proposal = await nance.proposalHandler.getContentMarkdown(proposal.hash);
  //   await nance.dProposalHandler.addProposalToDb(proposal);
  // });
  const config = await getConfig();
  const nance = new Nance(config);
  await sleep(1000);
  console.log(await nance.dProposalHandler.getDiscussionProposals());
}

main();
