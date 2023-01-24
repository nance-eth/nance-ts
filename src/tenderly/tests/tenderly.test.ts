import { TenderlyHandler } from '../tenderlyHandler';
import { getConfig } from '../../configLoader';
import { NanceTreasury } from '../../treasury';
import { DoltHandler } from '../../dolt/doltHandler';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler(
    { database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD },
    config.propertyKeys
  );
  const treasury = new NanceTreasury(config, dolt);
  const txn = await treasury.fetchReconfiguration('V1');
  const tenderly = new TenderlyHandler();
  const forkRPC = await tenderly.createFork('JB_GC#40');
  console.log(forkRPC);
}

main();
