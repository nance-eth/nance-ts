import { getNextEventByName } from '../getNextEventByName';
import { getSpaceConfig } from '../getSpace';
import { EVENTS } from '../../../constants';

async function test(space: string, eventName: string) {
  const spaceConfig = await getSpaceConfig(space);
  const nextEvent = getNextEventByName(eventName, spaceConfig);
  console.log(nextEvent);
}

test('daosquare', EVENTS.SNAPSHOT_VOTE);
