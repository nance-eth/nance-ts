import 'dotenv/config';
import { DoltHandler } from '../doltHandler';
import { getConfig } from '../../configLoader';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler({
    host: process.env.DOLT_HOST,
    port: Number(process.env.DOLT_PORT),
    database: config.dolt.repo }, config.propertyKeys
  );
  dolt.localDolt.checkout('main');
  console.log(await dolt.incrementGovernanceCycle());
}

main();
