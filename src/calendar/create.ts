// create JSON calendar from GovernanceForm
import { GovernanceCycleForm, DateEvent, FormTime } from '../types';
import { addDaysToDate, dateAtTime, formatUTCTime } from '../utils';
import { EVENTS } from '../constants';

const formToSQLTime = (timeIn?: FormTime) => {
  if (!timeIn) { return '00:00:00'; }
  const hour = -1 * (timeIn.hour + (timeIn.timezoneOffset / 60) + (timeIn.ampm === 'PM' ? 12 : 0) - 24);
  const hourString = hour.toString().padStart(2, '0');
  return `${hourString}:${timeIn.minute}:00`;
};

const formToCycleStageLengths = (form?: GovernanceCycleForm) => {
  if (!form) { return [3, 4, 4, 3]; }
  return [
    Number(form.temperatureCheckLength),
    Number(form.voteLength),
    Number(form.executionLength),
    Number(form.delayLength),
  ];
};

export const createCalendarAndCycleInfo = (governanceCycleForm: GovernanceCycleForm) => {
  const cycleTriggerTime = formToSQLTime(governanceCycleForm?.time);
  const cycleStageLengths = formToCycleStageLengths(governanceCycleForm);
  const dateEntry = formatUTCTime(new Date(governanceCycleForm.startDate));
  const startDate = dateAtTime(dateEntry, cycleTriggerTime);
  let end = addDaysToDate(startDate, cycleStageLengths[0]);
  let start = startDate;
  const calendar = Object.values(EVENTS).map((event, index) => {
    end = index === 0 ? end : addDaysToDate(end, cycleStageLengths[index]);
    // console.log('end', end);
    const ret = {
      title: event,
      start,
      end,
    };
    start = end;
    return ret;
  });

  return { calendar, cycleTriggerTime, cycleStageLengths } as { calendar: DateEvent[], cycleTriggerTime: string, cycleStageLengths: number[] };
};
