import { getConfig } from '../../configLoader';
import { getLastSlash as getIdFromURL } from '../../utils';
import { GithubProposalHandler } from '../githubProposalHandler';

async function main() {
  const config = await getConfig();
  const proposalHandler = new GithubProposalHandler(config);

  const pickedProposal = await proposalHandler.updateMetaData('JBP-233', 'status', 'Voting');
  console.log(JSON.stringify(pickedProposal, null, 4));
}

main();

// async updateMetaData(
//   proposalIdsToUpdate: string[],
//   updateProperty: string[],
//   updateValues: string[]
// ) {
//   const db = await this.fetchDb();
//   db.forEach((proposal: Proposal, index: number) => {
//     if (proposalIdsToUpdate.indexOf(proposal.proposalId) > -1) {
//       db[index] = { ...proposal, [updateProperty[index]]: updateValues[index] };
//     }
//   });
//   this.githubHandler.updateContent(this.database, JSON.stringify(db, null, 4));
// }
