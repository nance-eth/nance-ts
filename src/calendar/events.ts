import { InternalDateEvent, DateEvent, GovernanceEventName } from '@nance/nance-sdk';
import { EVENTS, ONE_DAY_MILLISECONDS } from '../constants';
import { addDaysToDate } from "../utils";

const cycleStageLengthsToInterval = (cycleStageLengths: number[]) => {
  const totalCycleDays = cycleStageLengths.reduce((a, b) => { return a + b; }, 0);
  return totalCycleDays * ONE_DAY_MILLISECONDS;
};

export const getNextEvents = (originalStart: Date, cycleStageLengths: number[], inputDate: Date): InternalDateEvent[] => {
  const interval = cycleStageLengthsToInterval(cycleStageLengths);
  const repeats = Math.floor((inputDate.getTime() - new Date(originalStart).getTime()) / interval);
  const nextEvents: InternalDateEvent[] = [];
  GovernanceEventName.forEach((name, index) => {
    if (name === "Unknown") return;
    if (cycleStageLengths[index] === 0) return;
    const start = (index > 0)
      ? nextEvents[index - 1].end
      : new Date(originalStart.getTime() + (repeats * interval));
    const end = addDaysToDate(start, cycleStageLengths[index]);
    nextEvents.push({
      title: name,
      start,
      end,
    });
  });
  // sort by start date and remove events that have ended
  const nextEventsCleaned = nextEvents.sort((a, b) => {
    return a.start.getTime() - b.start.getTime();
  }).filter((event) => {
    return event.end.getTime() > inputDate.getTime();
  });
  return nextEventsCleaned;
};

export const getCurrentEvent = (originalStart: Date, cycleStageLengths: number[], inputDate: Date) : InternalDateEvent => {
  const nextEvents = getNextEvents(originalStart, cycleStageLengths, inputDate);
  const currentEvent = nextEvents.find((event) => {
    return inputDate >= event.start && inputDate < event.end;
  });
  return currentEvent as InternalDateEvent;
};

export const getCycleStartDays = (cycleStageLengths: number[]) => {
  let accumulatedDays = 1;
  return cycleStageLengths.map((_, index, array) => {
    if (index === 0) return 1;
    accumulatedDays += array[index - 1];
    return accumulatedDays;
  });
};

export const getCurrentGovernanceCycleDay = (currentEvent: InternalDateEvent, cycleStageLengths: number[], input: Date) => {
  if (!currentEvent) return 0;
  const cycleStartDays = getCycleStartDays(cycleStageLengths);
  const eventIndex = Object.values(GovernanceEventName).indexOf(currentEvent.title);
  const dayDelta = Math.floor((input.getTime() - currentEvent.start.getTime()) / ONE_DAY_MILLISECONDS);
  const currentGovernanceCycleDay = cycleStartDays[eventIndex] + dayDelta;
  return currentGovernanceCycleDay;
};
