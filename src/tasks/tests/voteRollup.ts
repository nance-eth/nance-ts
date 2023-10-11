import { getSpaceConfig } from '../../api/helpers/getSpace';
import { getCurrentEvent, getNextEvents } from '../../calendar/events';
import { ONE_HOUR_SECONDS, TASKS } from '../../constants';
import { addSecondsToDate } from '../../utils';
import { sendStartOrEndAlert } from '../sendStartOrEndAlert';
import { voteRollup } from '../voteRollup';

async function main() {
  const spaceConfig = await getSpaceConfig('juicebox');
  const events = getNextEvents(spaceConfig.calendar, spaceConfig.cycleStageLengths, new Date());
  console.log(events[0]);
  // const currentEvent = getCurrentEvent(getNextEvents, spaceConfig.cycleStageLengths);
  await voteRollup(spaceConfig.config, events[0].end);
}

main();
