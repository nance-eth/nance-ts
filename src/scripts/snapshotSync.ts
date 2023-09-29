import { doltConfig } from '../configLoader';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { sleep } from '../utils';

async function main() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  await sleep(2000);
  const dolt = new DoltHandler(pools[config.name], config.propertyKeys);
  const snapshot = new SnapshotHandler('', config);
  const proposals = await snapshot.getAllProposalsByScore(true);
  // console.log(proposals)
  proposals.forEach(async (proposal) => {
    dolt.addProposalToDb(proposal);
  });
}

main();
