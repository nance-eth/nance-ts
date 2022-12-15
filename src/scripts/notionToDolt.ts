import { getConfig } from '../configLoader';
import { DoltHandler } from '../dolt/doltHandler';
import { getLastSlash } from '../utils';
import { keys } from '../keys';
import { NotionHandler } from '../notion/notionHandler';
import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { oneLine } from 'common-tags';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const dolt = new DoltHandler(config.dolt.repo, config.propertyKeys);
  const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, keys.INFURA_KEY, config);
  // const proposals = (await notion.getProposalsByGovernanceCycle('38')).filter((proposal) => { return proposal.status === 'Approved' });
  // const voteResults = await snapshot.getProposalVotes(
  //   proposals.map((proposal) => { return `"${getLastSlash(proposal.voteURL)}"`; })
  // );
  // proposals.map(async (proposal) => {
  //   proposal.voteResults = voteResults.find((vote) => { return vote.voteProposalId === getLastSlash(proposal.voteURL); })
  //   proposal.body = (await notion.getContentMarkdown(proposal.hash)).body;
  //   dolt.updateVotingClose(proposal);
  // });
  await dolt.setCurrentGovernanceCycle(38);
  const proposals = (await notion.getProposalsByGovernanceCycle('38'));
  proposals.forEach(async (proposal) => {
    proposal.body = (await notion.getContentMarkdown(proposal.hash)).body;
    dolt.addProposalToDb(proposal);
  })
}

main();