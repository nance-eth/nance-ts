/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
import { getSpaceConfig } from '../../api/helpers/getSpace';
import { STATUS } from '../../constants';
import { sleep } from '../../utils';
import { DoltHandler } from '../doltHandler';
import { pools } from '../pools';

async function main() {
  const { config } = await getSpaceConfig('waterbox');
  await sleep(1000);
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  const proposals = await dolt.getProposals({ where: `proposalStatus = "${STATUS.TEMPERATURE_CHECK}" OR proposalStatus = "${STATUS.VOTING}"` });
  console.log(proposals.proposals.length);
}

main();
