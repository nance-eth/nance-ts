import { GovernanceEvent, SQLSpaceConfig } from "@nance/nance-sdk";
import { getNextEvents } from "@/calendar/events";

export const getNextEventByName = (eventName: GovernanceEvent, spaceConfig: SQLSpaceConfig) => {
  if (!spaceConfig.cycleStageLengths || !spaceConfig.cycleStartReference) return null;
  const nextEvents = getNextEvents(spaceConfig.cycleStartReference, spaceConfig.cycleStageLengths, new Date());
  const nextEvent = nextEvents.find((event) => {
    return event.title === eventName;
  });
  return nextEvent;
};
