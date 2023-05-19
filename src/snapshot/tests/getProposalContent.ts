import { keys } from '../../keys';
import { SnapshotHandler } from '../snapshotHandler';
import { doltConfig } from '../../configLoader';
import { DoltHandler } from '../../dolt/doltHandler';
import { dbOptions } from '../../dolt/dbConfig';

async function main() {
  const { config } = await doltConfig('thirstythirsty');
  const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, config);
  const dolt = new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
  const proposals = await snapshot.getAllProposalsByScore(true);
  proposals.forEach((proposal) => {
    dolt.addProposalToDb(proposal);
  });
}

main();
