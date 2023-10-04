import { DateEvent } from '../types';
import { EVENTS, ONE_DAY_MILLISECONDS } from '../constants';

const cycleStageLengthsToInterval = (cycleStageLengths: number[]) => {
  const totalCycleDays = cycleStageLengths.reduce((a, b) => { return a + b; }, 0);
  return totalCycleDays * ONE_DAY_MILLISECONDS;
};

export const getNextEvents = (events: DateEvent[], cycleStageLengths: number[], inputDate: Date): DateEvent[] => {
  const interval = cycleStageLengthsToInterval(cycleStageLengths);
  const dateDelta = inputDate.getTime() - new Date(events[0].start).getTime();
  const repeats = Math.floor((inputDate.getTime() - new Date(events[0].start).getTime()) / interval);
  const nextEvents: DateEvent[] = [];
  events.forEach((event) => {
    const originalStart = new Date(event.start);
    const originalEnd = new Date(event.end);
    const start = new Date(originalStart.getTime() + repeats * interval);
    const end = new Date(originalEnd.getTime() + repeats * interval);
    if (inputDate > end) { return; }
    nextEvents.push({
      title: event.title,
      start,
      end,
    });
  });
  // always add one more of the first event so that if we are at the last event in cycle we know the next one
  nextEvents.push({
    title: events[0].title,
    start: new Date(nextEvents[nextEvents.length - 1].end.getTime()),
    end: new Date(new Date(events[0].end).getTime() + ((repeats + 1) * interval)),
  });
  return nextEvents;
};

export const getCurrentEvent = (events: DateEvent[], cycleStageLengths: number[], inputDate: Date) => {
  if (!cycleStageLengths) return undefined;
  const nextEvents = getNextEvents(events, cycleStageLengths, inputDate);
  const currentEvent = nextEvents.find((event) => {
    return inputDate >= event.start && inputDate < event.end;
  });
  return currentEvent;
};

export const getCycleStartDays = (cycleStageLengths: number[]) => {
  let accumulatedDays = 1;
  return cycleStageLengths.map((_, index, array) => {
    if (index === 0) return 1;
    accumulatedDays += array[index - 1];
    return accumulatedDays;
  });
};

export const getCurrentGovernanceCycleDay = (currentEvent: DateEvent, cycleStageLengths: number[], input: Date) => {
  if (!currentEvent) return 0;
  const cycleStartDays = getCycleStartDays(cycleStageLengths);
  const eventIndex = Object.values(EVENTS).indexOf(currentEvent.title);
  const dayDelta = new Date(input).getUTCDate() - new Date(currentEvent.start).getUTCDate();
  const currentGovernanceCycleDay = cycleStartDays[eventIndex] + dayDelta;
  return currentGovernanceCycleDay;
};
