import { DateEvent } from '../../types';
import { addDaysToDate } from '../../utils';
import { SpaceConfig } from '../schema';

const cycleStageNames = ['Temperature Check', 'Snapshot Vote', 'Execution', 'Delay'];

export const getTriggerTimeToday = (info: SpaceConfig): Date => {
  const date = new Date();
  const [triggerHour, triggerMinute, triggerSeconds] = info.cycleTriggerTime.split(':');
  date.setUTCHours(Number(triggerHour));
  date.setUTCMinutes(Number(triggerMinute));
  date.setUTCSeconds(Number(triggerSeconds));
  date.setUTCMilliseconds(0);
  return date;
};

export const getEventDate = (
  info: SpaceConfig,
  cycleStartDays: number[],
  stageIndex: number
): DateEvent => {
  const now = getTriggerTimeToday(info);
  const daysSinceStart = info.cycleCurrentDay - cycleStartDays[stageIndex];
  const daysRemaining = info.cycleStageLengths[stageIndex] - daysSinceStart;
  const start = addDaysToDate(now, -1 * daysSinceStart);
  const end = addDaysToDate(now, daysRemaining);
  return {
    title: cycleStageNames[stageIndex],
    start,
    end,
  };
};

export const getCurrentEvent = (info: SpaceConfig) => {
  let accumulatedDays = 0;
  const cycleStartDays = info.cycleStageLengths.map((day, index) => {
    if (index === 0) return 1;
    accumulatedDays += day;
    return accumulatedDays;
  });
  // get first start day that is less than or equal to current day
  const stageIndex = cycleStartDays.indexOf(cycleStartDays.filter((day) => { return day <= info.cycleCurrentDay; }).pop() as number);
  return getEventDate(info, cycleStartDays, stageIndex);
};
