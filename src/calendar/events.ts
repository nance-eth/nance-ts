import { InternalDateEvent, GovernanceEventName } from '@nance/nance-sdk';
import { ONE_DAY_MILLISECONDS } from '../constants';
import { addDaysToDate } from "../utils";

export const getCycleStartDays = (cycleStageLengths: number[]) => {
  let accumulatedDays = 1;
  return cycleStageLengths.map((_, index, array) => {
    if (array[index] === 0) return 0;
    if (index === 0) return 1;
    accumulatedDays += array[index - 1];
    return accumulatedDays;
  });
};

const cycleStageLengthsToInterval = (cycleStageLengths: number[]) => {
  const totalCycleDays = cycleStageLengths.reduce((a, b) => { return a + b; }, 0);
  return totalCycleDays * ONE_DAY_MILLISECONDS;
};

export const getNextEvents = (originalStart: Date, cycleStageLengths: number[], inputDate: Date): InternalDateEvent[] => {
  const interval = cycleStageLengthsToInterval(cycleStageLengths);
  const repeats = Math.floor((inputDate.getTime() - new Date(originalStart).getTime()) / interval);
  const nextEvents: InternalDateEvent[] = [];
  const accumulatedDays = getCycleStartDays(cycleStageLengths);
  GovernanceEventName.forEach((name, index) => {
    if (name === "Unknown") return;
    if (cycleStageLengths[index] === 0) return;
    const start = addDaysToDate(new Date(originalStart.getTime() + (repeats * interval)), accumulatedDays[index] - 1);
    const end = addDaysToDate(start, cycleStageLengths[index]);
    nextEvents.push({
      title: name,
      start,
      end,
    }, {
      title: name,
      start: new Date(start.getTime() + interval),
      end: new Date(end.getTime() + interval),
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

export const getCurrentEvent = (
  originalStart: Date,
  cycleStageLengths: number[],
  inputDate: Date,
  _nextEvents?: InternalDateEvent[],
) : InternalDateEvent => {
  const nextEvents = _nextEvents || getNextEvents(originalStart, cycleStageLengths, inputDate);
  const currentEvent = nextEvents.find((event) => {
    return inputDate >= event.start && inputDate < event.end;
  });
  return currentEvent as InternalDateEvent;
};

export const getCurrentGovernanceCycleDay = (currentEvent: InternalDateEvent, cycleStageLengths: number[], input: Date) => {
  if (!currentEvent) return 0;
  const cycleStartDays = getCycleStartDays(cycleStageLengths);
  const eventIndex = Object.values(GovernanceEventName).indexOf(currentEvent.title);
  const dayDelta = Math.floor((input.getTime() - currentEvent.start.getTime()) / ONE_DAY_MILLISECONDS);
  const currentGovernanceCycleDay = cycleStartDays[eventIndex] + dayDelta;
  return currentGovernanceCycleDay;
};
