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

async function updateStatusTo(status: string) {
  const proposal = { hash: '5b9e15e19f12475e802e6b4ff0743a7', governanceCycle: 33 };
  const res = await dolt.updateStatus(proposal, status);
  console.log(res);
  const poll = await dolt.dolt.poll(res.operation_name);
  if (poll?.res_details.query_execution_status === 'Success') {
    console.log('success');
  } else {
    console.log(poll?.res_details.query_execution_message);
  }
}

updateStatusTo('Discussion');
