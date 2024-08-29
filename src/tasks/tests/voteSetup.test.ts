import { getSpaceConfig } from '../../api/helpers/getSpace';
import { addDaysToDate, sleep } from '../../utils';
import { voteSetup } from '../voteSetup';

const space = 'moondao';

async function main() {
  const { config } = await getSpaceConfig(space);
  await sleep(2000);
  const testEndDate = addDaysToDate(new Date(), 1);
  try {
    await voteSetup(space, config, testEndDate);
  } catch (e) {
    console.error(e);
  }
}

main();
