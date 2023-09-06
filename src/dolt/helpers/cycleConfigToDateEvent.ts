import { events } from '../../api/helpers/auto/constants';
import { DateEvent } from '../../types';
import { addDaysToDate, dateAtTime } from '../../utils';
import { SpaceConfig } from '../schema';

const cycleStageNames = ['Temperature Check', 'Snapshot Vote', 'Execution', 'Delay'];

const getEventDate = (
  info: SpaceConfig,
  cycleStartDays: number[],
  stageIndex: number,
): DateEvent[] => {
  const now = new Date();
  const startOfToday = dateAtTime(now, info.cycleTriggerTime);
  const daysSinceStart = info.cycleCurrentDay - cycleStartDays[stageIndex];
  const daysRemaining = info.cycleStageLengths[stageIndex] - daysSinceStart + 1;
  const start = startOfToday;
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

export const getCurrentEvent = (info: SpaceConfig) => {
  let accumulatedDays = 0;
  if (!info.cycleStageLengths) return [undefined, undefined] as unknown as DateEvent[];
  const cycleStartDays = info.cycleStageLengths.map((day, index) => {
    if (index === 0) return 1;
    accumulatedDays += day;
    return accumulatedDays;
  });
  // get first start day that is less than or equal to current day
  const stageIndex = cycleStartDays.indexOf(cycleStartDays.filter((day) => { return day <= info.cycleCurrentDay; }).pop() as number);
  return getEventDate(info, cycleStartDays, stageIndex);
};
