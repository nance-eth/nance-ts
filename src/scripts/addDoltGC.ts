import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';
import { NotionHandler } from '../notion/notionHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { Nance } from '../nance';

async function main(){
  const config = await getConfig();
  const nance = new Nance(config);
  const dolt = new DoltHandler(
    { database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD }, config.propertyKeys
  );
  const treasury = new NanceTreasury(config, dolt);
  const governanceCycle = await treasury.getCycleInformation();
  nance.incrementGovernanceCycle(governanceCycle);
}

main();