import { SpaceConfig } from '@nance/nance-sdk';
import { getNextEvents } from '../../calendar/events';

export const getNextEventByName = (eventName: string, spaceConfig: SpaceConfig) => {
  if (!spaceConfig.calendar || !spaceConfig.cycleStageLengths) return null;
  const nextEvents = getNextEvents(spaceConfig.calendar, spaceConfig.cycleStageLengths, new Date());
  const nextEvent = nextEvents.find((event) => {
    return event.title === eventName;
  });
  return nextEvent;
};
