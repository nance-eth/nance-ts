import { getConfig } from '../../configLoader';
import { dbOptions } from '../dbConfig';
import { DoltHandler } from '../doltHandler';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
  console.log(await dolt.localDolt.changes('proposals'));
}

main();
