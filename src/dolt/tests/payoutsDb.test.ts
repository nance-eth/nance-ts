import { DoltHandler } from '../doltHandler';
import { getConfig } from '../../configLoader';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler({ database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD }, config.propertyKeys);
  // const payouts = await dolt.getPayoutsDb('V3');
  // const total = payouts.reduce((sum, payout) => { return sum + payout.amount; }, 0);
  // console.log(payouts.some((payout) => { return payout.currency === 'percent'; }));
  // console.log(payouts);
  const payOuts = await dolt.getPayoutsDb('V3');
}

main();
