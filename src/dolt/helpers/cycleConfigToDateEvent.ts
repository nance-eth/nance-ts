import { DateEvent } from '../../types';
import { addDaysToDate, dateAtTime } from '../../utils';
import { SpaceConfig } from '../schema';

const cycleStageNames = ['Temperature Check', 'Snapshot Vote', 'Execution', 'Delay'];

export const getEventDates = (
  now: Date,
  info: SpaceConfig,
  cycleStartDays: number[],
  stageIndex: number,
): DateEvent[] => {
  const startOfToday = dateAtTime(now, info.cycleTriggerTime);
  const daysSinceStart = info.cycleCurrentDay - cycleStartDays[stageIndex] - 1;
  const daysRemaining = info.cycleStageLengths[stageIndex] - daysSinceStart;
  const start = addDaysToDate(startOfToday, -daysSinceStart);
  const end = addDaysToDate(startOfToday, daysRemaining);
  const currentEvent = {
    title: cycleStageNames[stageIndex],
    start,
    end,
  };
  // find next stage index event
  const nextStageIndex = (stageIndex + 1) % cycleStartDays.length;
  const nextStart = end;
  const nextEnd = addDaysToDate(end, info.cycleStageLengths[nextStageIndex]);
  const nextEvent = {
    title: cycleStageNames[nextStageIndex],
    start: nextStart,
    end: nextEnd,
  };
  return [
    currentEvent,
    nextEvent,
  ];
};

export const getCycleStartDays = (info: SpaceConfig) => {
  let accumulatedDays = 0;
  return info.cycleStageLengths.map((day, index) => {
    if (index === 0) return 1;
    accumulatedDays += day;
    return accumulatedDays;
  });
};

export const getStageIndex = (info: SpaceConfig, cycleStartDays: number[]) => {
  // get first start day that is less than or equal to current day = last element of cycle start days array
  return cycleStartDays.indexOf(cycleStartDays.filter((day) => { return day <= info.cycleCurrentDay; }).pop() as number);
};

export const getCurrentAndNextEvent = (info: SpaceConfig) => {
  if (!info.cycleStageLengths) return [undefined, undefined] as unknown as DateEvent[];
  const cycleStartDays = getCycleStartDays(info);
  const stageIndex = getStageIndex(info, cycleStartDays);
  const now = new Date();
  return getEventDates(now, info, cycleStartDays, stageIndex);
};
