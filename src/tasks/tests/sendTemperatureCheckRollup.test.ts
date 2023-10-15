import { getSpaceConfig } from '../../api/helpers/getSpace';
import { ONE_HOUR_SECONDS, TASKS } from '../../constants';
import { addSecondsToDate } from '../../utils';
import { sendStartOrEndAlert } from '../sendStartOrEndAlert';
import { temperatureCheckClose } from '../temperatureCheckClose';
import { temperatureCheckRollup } from '../temperatureCheckRollup';

async function main() {
  const spaceConfig = await getSpaceConfig('waterbox');
  const mockEndTime = addSecondsToDate(new Date(), ONE_HOUR_SECONDS);
  await temperatureCheckRollup(spaceConfig.config, mockEndTime);
}

main();
