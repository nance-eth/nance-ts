import { getSpaceConfig } from '../../api/helpers/getSpace';
import { ONE_HOUR_SECONDS, TASKS } from '../../constants';
import { addSecondsToDate } from '../../utils';
import { sendStartOrEndAlert } from '../sendStartOrEndAlert';

async function main() {
  const spaceConfig = await getSpaceConfig('waterbox');
  const mockEndTime = addSecondsToDate(new Date(), ONE_HOUR_SECONDS);
  await sendStartOrEndAlert(spaceConfig.config, mockEndTime, 'Temperature Check', TASKS.temperatureCheckEndAlert, 'end');
}

main();
