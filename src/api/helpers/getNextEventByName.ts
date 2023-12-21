import { getNextEvents } from '../../calendar/events';
import { SpaceConfig } from '../../dolt/schema';

export const getNextEventByName = (eventName: string, spaceConfig: SpaceConfig) => {
  const nextEvents = getNextEvents(spaceConfig.calendar, spaceConfig.cycleStageLengths, new Date());
  const nextEvent = nextEvents.find((event) => {
    return event.title === eventName;
  });
  return nextEvent;
};
