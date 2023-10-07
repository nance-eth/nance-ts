import { getSpaceInfo } from '../api/helpers/getSpaceInfo';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { numToPrettyString, sleep } from '../utils';

async function main() {
  const { config } = await getSpaceInfo(process.env.CONFIG || '');
  await sleep(500);
  const snapshot = new SnapshotHandler('', config);
  const proposals = await snapshot.getAllProposalsByScore();
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  let proposal: any;
  for (let i = 0; i < proposals.length; i+= 1) {
    proposal = proposals[i];
    await sleep(100);
    try {
      const dProposal = await dolt.getProposalByAnyId(proposal.id);
      console.log(`${i} - ${dProposal.title}\nhttps://jbdao.org/p/${dProposal.proposalId} \nParticipants: ${proposal.votes} Total: ${numToPrettyString(proposal.scores_total)} For: ${numToPrettyString(proposal.scores[0])} Against: ${numToPrettyString(proposal.scores[1])}\n=========================`);
    } catch(e) {}
  }
}

main();
