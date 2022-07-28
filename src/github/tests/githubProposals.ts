import { getConfig } from '../../configLoader';
import { getLastSlash as getIdFromURL } from '../../utils';
import { GithubProposalHandler } from '../githubProposalHandler';
import { GithubAPI } from '../githubAPI';
import { NanceConfig } from '../../types';
import { keys } from '../../keys';

async function main() {
  const config = await getConfig() as NanceConfig;
  const github = new GithubAPI(keys.GITHUB_KEY, config.github.user, config.github.repo);
  console.log(await github.getOid());
  const files = [
    {
      path: 'GC27/README.md',
      contents: 'ya its me again'
    },
    {
      path: 'GC28/README.md',
      contents: 'another one'
    }
  ];
  console.log(await github.createCommitOnBranch(files, 'another1'));
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
