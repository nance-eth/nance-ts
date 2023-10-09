import { getSpaceConfig } from '../../api/helpers/getSpace';
import { Proposal } from '../../types';
import { addDaysToDate } from '../../utils';
import { voteSetup } from '../voteSetup';
import { proposals } from './proposals.test';

async function main() {
  const { config } = await getSpaceConfig('waterbox');
  const testEndDate = addDaysToDate(new Date(), 1);
  try {
    await voteSetup(config, testEndDate, proposals as unknown as Proposal[]);
  } catch (e) {
    console.error(e);
  }
}

main();
