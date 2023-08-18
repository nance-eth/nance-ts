import { DateEvent } from '../../types';
import { addDaysToDate } from '../../utils';
import { SpaceConfig } from '../schema';

const cycleStageNames = ['Temperature Check', 'Snapshot Vote', 'Execution', 'Delay'];

export const getTriggerTimeToday = (info: SpaceConfig): Date => {
  const date = new Date();
  const [triggerHour, triggerMinute, triggerSeconds] = info.cycleTriggerTime.split(':');
  date.setHours(Number(triggerHour));
  date.setMinutes(Number(triggerMinute));
  date.setSeconds(Number(triggerSeconds));
  date.setMilliseconds(0);
  return date;
};

export const getEventDate = (
  info: SpaceConfig,
  cycleStartDays: number[],
  stageIndex: number
): DateEvent => {
  const now = getTriggerTimeToday(info);
  const daysSinceStart = currentDay ;
  console.log('daysSinceStart', daysSinceStart);
  const daysRemaining = cycleStartDays[stageIndex] - info.cycleCurrentDay;
  console.log('daysReminaing', daysRemaining);
  const start = addDaysToDate(now, daysSinceStart);
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

  const stageIndex = cycleStartDays.indexOf(cycleStartDays.filter((day) => { return day >= info.cycleCurrentDay; })[0]);
  const eventDate = getEventDate(info, stageIndex);
  return eventDate;
};
