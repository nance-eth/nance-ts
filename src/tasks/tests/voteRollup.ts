import { getSpaceConfig } from '../../api/helpers/getSpace';
import { getNextEvents } from '../../calendar/events';
import { voteRollup } from '../voteRollup';

const space = 'waterbox';

async function main() {
  const spaceConfig = await getSpaceConfig(space);
  const events = getNextEvents(spaceConfig.calendar, spaceConfig.cycleStageLengths, new Date());
  console.log(events[0]);
  // const currentEvent = getCurrentEvent(getNextEvents, spaceConfig.cycleStageLengths);
  await voteRollup(space, spaceConfig.config, events[0].end);
}

main();
