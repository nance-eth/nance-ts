import { getSpaceInfo } from '../api/helpers/getSpace';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { sleep } from '../utils';

async function main() {
  const { config } = await getSpaceInfo(process.env.CONFIG || '');
  await sleep(2000);
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  const lastProposalId = ((await dolt.getNextProposalId()) - 1).toString();
  const lastProposal = await dolt.getProposalByAnyId(lastProposalId);
  const lastProposalTime = lastProposal.lastEditedTime ? new Date(lastProposal?.lastEditedTime).getTime() / 1000 : undefined;
  const snapshot = new SnapshotHandler('', config);
  const proposals = await snapshot.getAllProposalsByScore(lastProposalTime);
  proposals.forEach(async (proposal) => {
    dolt.addProposalToDb(proposal);
  });
}

main();
