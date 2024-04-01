import { InternalDateEvent, DateEvent } from '@nance/nance-sdk';
import { EVENTS, ONE_DAY_MILLISECONDS } from '../constants';

const cycleStageLengthsToInterval = (cycleStageLengths: number[]) => {
  const totalCycleDays = cycleStageLengths.reduce((a, b) => { return a + b; }, 0);
  return totalCycleDays * ONE_DAY_MILLISECONDS;
};

export const getNextEvents = (events: DateEvent[], cycleStageLengths: number[], inputDate: Date): InternalDateEvent[] => {
  const interval = cycleStageLengthsToInterval(cycleStageLengths);
  const repeats = Math.floor((inputDate.getTime() - new Date(events[0].start).getTime()) / interval);
  const nextEvents: InternalDateEvent[] = [];
  events.forEach((event) => {
    const originalStart = new Date(event.start);
    const originalEnd = new Date(event.end);
    const start = new Date(originalStart.getTime() + repeats * interval);
    const end = new Date(originalEnd.getTime() + repeats * interval);
    nextEvents.push(
      {
        title: event.title,
        start,
        end,
      },
      {
        title: event.title,
        start: new Date(start.getTime() + interval),
        end: new Date(end.getTime() + interval),
      }
    );
  });
  // sort by start date and remove events that have ended
  const nextEventsCleaned = nextEvents.sort((a, b) => {
    return a.start.getTime() - b.start.getTime();
  }).filter((event) => {
    return event.end.getTime() > inputDate.getTime();
  });
  return nextEventsCleaned;
};

export const getCurrentEvent = (events: DateEvent[], cycleStageLengths: number[], inputDate: Date) : InternalDateEvent => {
  const nextEvents = getNextEvents(events, cycleStageLengths, inputDate);
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
  const eventIndex = Object.values(EVENTS).indexOf(currentEvent.title);
  const dayDelta = Math.floor((input.getTime() - currentEvent.start.getTime()) / ONE_DAY_MILLISECONDS);
  const currentGovernanceCycleDay = cycleStartDays[eventIndex] + dayDelta;
  return currentGovernanceCycleDay;
};
