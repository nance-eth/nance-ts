import { getSpaceConfig } from '../../api/helpers/getSpace';
import { ONE_HOUR_SECONDS, TASKS } from '../../constants';
import { addSecondsToDate, sleep } from '../../utils';
import { sendStartOrEndAlert } from '../sendStartOrEndAlert';
import { shouldSendAlert } from '../shouldSendAlert';

async function main() {
  const spaceConfig = await getSpaceConfig('juicebox');
  await sleep(2000);
  const mockEndTime = addSecondsToDate(new Date(), ONE_HOUR_SECONDS);
  const shouldSend = await shouldSendAlert(spaceConfig.space, spaceConfig.config);
  console.log('shouldSend', shouldSend);
  await sendStartOrEndAlert(spaceConfig.space, spaceConfig.config, mockEndTime, 'Temperature Check', TASKS.temperatureCheckStartAlert, 'start');
}

main();
