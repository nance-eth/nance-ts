import { TenderlyHandler } from '../tenderlyHandler';
import { getConfig } from '../../configLoader';
import { NanceTreasury } from '../../treasury';
import { DoltHandler } from '../../dolt/doltHandler';
import { keys } from '../../keys';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler(
    { database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD },
    config.propertyKeys
  );
  const tenderly = new TenderlyHandler({ account: 'jigglyjams', project: 'nance', key: keys.TENDERLY_KEY });
  const forkProvider = await tenderly.getForkProvider('JB_GC#TEST');
  const treasury = new NanceTreasury(config, dolt, forkProvider);
  const txn = await treasury.fetchReconfiguration('V3');
  await tenderly.sendTransaction(txn, config.juicebox.gnosisSafeAddress);
  await tenderly.advanceTime(3 * 24 * 60 * 60);
  const txnDistribute = await treasury.juiceboxHandlerV3.encodeDistributeFundsOf();
  await tenderly.sendTransaction(txnDistribute, config.juicebox.gnosisSafeAddress);
}

main();
