import { keys } from '../../keys';
import { DoltHandler } from '../doltHandler';

const dolt = new DoltHandler('jigglyjams', 'waterbox-governance', keys.DOLT_KEY);

async function main() {
  const res = await dolt.addProposalToDb({
    title: 'hihi',
    body: 'things',
    type: 'Payout',
    governanceCycle: 33,
    status: 'Draft'
  });
  console.log(res);
}

main();
