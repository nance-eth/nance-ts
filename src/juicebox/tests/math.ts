import { BigNumber } from '@ethersproject/bignumber';
import { DoltHandler } from '../../dolt/doltHandler';
import { NanceTreasury } from '../../treasury';
import { getConfig } from '../../configLoader';
import { ONE_BILLION } from '../juiceboxMath';
import { myProvider } from '../../utils';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler({ database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD }, config.propertyKeys);
  const treasury = new NanceTreasury(config, dolt, myProvider('mainnet'));
  const payouts = await dolt.getPayoutsDb('V3');
  const distributionLimit = treasury.juiceboxHandlerV3.calculateNewDistributionLimit(payouts);
  let sum = 0;
  payouts.forEach((pay) => {
    const o = BigNumber.from(pay.amount).mul(BigNumber.from(ONE_BILLION)).div(distributionLimit);
    sum += Number(o);
    console.log(`${o.toString()} - $${pay.amount}`);
  });
  console.log('=========');
  console.log(sum);
}

main();
