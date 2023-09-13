import { doltConfig } from '../../configLoader';
import { keys } from '../../keys';
import { SnapshotHandler } from '../snapshotHandler';

async function main() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  const snapshotHandler = new SnapshotHandler(keys.PRIVATE_KEY, config);
  console.log(await snapshotHandler.getVotingSettings());
}

main();
