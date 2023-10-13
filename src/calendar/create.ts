// create JSON calendar from GovernanceForm
import { GovernanceCycleForm, DateEvent } from '../types';
import { addDaysToDate, dateAtTime } from '../utils';
import { EVENTS } from '../constants';

export const createCalendar = (cycleStageLengths: number[], cycleTriggerTime: string) => {
  //  ////// WIP ////////
  const calendar: DateEvent[] = [];
  const cycleStartDay = new Date();
  const cycleStageStartDays = cycleStageLengths.reduce((acc, stageLength) => {
    const prevStageStart = acc[acc.length - 1] || cycleStartDay;
    const nextStageStart = addDaysToDate(prevStageStart, stageLength);
    return [...acc, nextStageStart];
  }, [] as Date[]);
  const cycleStageEndDays = cycleStageStartDays.map((stageStart, i) => {
    const stageLength = cycleStageLengths[i];
    return addDaysToDate(stageStart, stageLength);
  });
  const cycleStageNames = ['Proposal Submission', 'Proposal Discussion', 'Proposal Voting', 'Proposal Results'];
  cycleStageStartDays.forEach((stageStart, i) => {
    const stageEnd = cycleStageEndDays[i];
    const stageName = cycleStageNames[i];
    calendar.push({
      title: stageName,
      start: stageStart,
      end: stageEnd
    });
  });
  return calendar;
};
