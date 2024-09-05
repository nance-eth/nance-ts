import { GovernanceEvent } from '@nance/nance-sdk';
import { getNextEventByName } from '../getNextEventByName';
import { getSpaceConfig } from '../getSpace';

async function test(space: string, eventName: GovernanceEvent) {
  const spaceConfig = await getSpaceConfig(space);
  const nextEvent = getNextEventByName(eventName, spaceConfig);
  console.log(nextEvent);
}

test('daosquare', "Snapshot Vote");
