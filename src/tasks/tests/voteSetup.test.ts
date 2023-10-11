import { getSpaceConfig } from '../../api/helpers/getSpace';
import { Proposal } from '../../types';
import { addDaysToDate, sleep } from '../../utils';
import { voteSetup } from '../voteSetup';
import { proposals } from './proposals.test';

async function main() {
  const { config } = await getSpaceConfig('waterbox');
  await sleep(2000);
  const testEndDate = addDaysToDate(new Date(), 1);
  try {
    await voteSetup(config, testEndDate);
  } catch (e) {
    console.error(e);
  }
}

main();
