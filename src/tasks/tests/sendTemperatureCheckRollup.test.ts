import { getSpaceConfig } from '../../api/helpers/getSpace';
import { ONE_HOUR_SECONDS, TASKS } from '../../constants';
import { addSecondsToDate } from '../../utils';
import { temperatureCheckRollup } from '../temperatureCheckRollup';

const space = 'waterbox';

async function main() {
  const spaceConfig = await getSpaceConfig(space);
  const mockEndTime = addSecondsToDate(new Date(), ONE_HOUR_SECONDS);
  await temperatureCheckRollup(space, spaceConfig.config, mockEndTime);
}

main();
