import { Nance } from '../nance';
import { NanceExtensions } from '../extensions';
import { getConfig } from '../configLoader';
import { getLastSlash as getIdFromURL } from '../utils';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const nanceExt = new NanceExtensions(config);

  const db = await nanceExt.getGitGovernanceDB();
  const currentCycleProposals = db.filter((proposal: any) => {
    return proposal['Funding Cycle'] === '27'
  })
  const voteProposalIdStrings = currentCycleProposals.map((proposal:any) => {
    return `"${getIdFromURL(proposal.Voting)}"`;
  });
  console.log(voteProposalIdStrings);
}

main();