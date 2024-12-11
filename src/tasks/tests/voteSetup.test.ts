import { initializePools } from '@/dolt/pools';
import { getSpaceConfig } from '../../api/helpers/getSpace';
import { addDaysToDate } from '../../utils';
import { voteSetup } from '../voteSetup';

const space = 'waterbox';

async function main() {
  await initializePools();
  const { config } = await getSpaceConfig(space);
  const testEndDate = addDaysToDate(new Date(), 1);
  try {
    await voteSetup(space, config, testEndDate);
  } catch (e) {
    console.error(e);
  }
}

main();
