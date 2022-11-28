import { keys } from '../../keys';
import { DoltHandler } from '../doltHandler';
import { getConfig } from '../../configLoader';
import { Proposal } from '../../types';

let config;
let dolt: DoltHandler;

async function setup() {
  config = await getConfig();
  dolt = new DoltHandler('jigglyjams', 'waterbox-governance', keys.DOLT_KEY, config.propertyKeys);
}

async function metadata() {
  console.log(await dolt.dolt.metadata());
}

async function main() {
  await setup();
  // const res = await dolt.addProposalToDb({
  //   title: 'hihi',
  //   body: 'things',
  //   type: 'Payout',
  //   governanceCycle: 33,
  //   status: 'Draft'
  // });
  // console.log(res);
  dolt.currentGovernanceCycle = 33;
  const proposals = [
    {
      hash: '1b873d52cce54113942ba27d5ec24f5a',
      status: 'Temperature Check',
      discussionThreadURL: 'wdfwdf'
    },
    {
      hash: '5b9e15e19f12475e802e6b4ff07a43a7',
      status: 'Cancelled',
      discussionThreadURL: 'wdfwdf'
    }
  ];
  dolt.updateStatusTemperatureCheckAndProposalId(proposals as Proposal[]);
}

async function updateStatusTo(status: string) {
  const proposal = { hash: '5b9e15e19f12475e802e6b4ff07a43a7', governanceCycle: 33 };
  const res = await dolt.updateStatus(proposal, status);
  console.log(res);
  const poll = await dolt.dolt.poll(res.operation_name, '33');
  if (poll?.res_details.query_execution_status === 'Success') {
    console.log('success');
  } else {
    console.log(poll?.res_details.query_execution_message);
  }
}

main();
