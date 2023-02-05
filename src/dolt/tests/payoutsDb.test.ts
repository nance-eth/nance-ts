import { DoltHandler } from '../doltHandler';
import { getConfig } from '../../configLoader';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler({ database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD }, config.propertyKeys);
  // const payouts = await dolt.getPayoutsDb('V3');
  // const total = payouts.reduce((sum, payout) => { return sum + payout.amount; }, 0);
  // console.log(payouts.some((payout) => { return payout.currency === 'percent'; }));
  // console.log(payouts);
  const currentPayouts = await dolt.getPreviousPayoutsDb('V3', 40);
  const futurePayouts = await dolt.getPayoutsDb('V3');
  let total = 0;
  const currentPayoutsPretty = currentPayouts.map((pay) => {
    total += pay.amount;
    return {
      // name: pay.payAddress || pay.payProject,
      // other: pay.payName,
      // amount: pay.amount,
      pid: pay.proposalId
    };
  }).sort((a, b) => { return a.pid! - b.pid!; });

  const furturePayoutsPretty = futurePayouts.map((pay) => {
    total += pay.amount;
    return {
      // name: pay.payAddress || pay.payProject,
      // other: pay.payName,
      // amount: pay.amount,
      pid: pay.proposalId
    };
  }).sort((a, b) => { return a.pid! - b.pid!; });
  console.log(currentPayoutsPretty);
  console.log(furturePayoutsPretty);
  console.log(total);
}

main();
