// create JSON calendar from GovernanceForm
import { GovernanceCycleForm, DateEvent, FormTime, GovernanceEventName } from "@nance/nance-sdk";
import { addDaysToDate, dateAtTime, formatUTCTime } from "../utils";

const formToSQLTime = (timeIn?: FormTime) => {
  if (!timeIn) { return { cycleTriggerTime: "00:00:00", hadToRollOver: false }; }
  let hadToRollOver = false;
  let hour = -1 * (timeIn.hour + (timeIn.timezoneOffset / 60) + (timeIn.ampm === "PM" ? 12 : 0) - 24);
  if (hour < 0) {
    hour *= -1;
    hadToRollOver = true;
  }
  const hourString = hour.toString().padStart(2, "0");
  return { cycleTriggerTime: `${hourString}:${timeIn.minute}:00`, hadToRollOver };
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
  const { cycleTriggerTime, hadToRollOver } = formToSQLTime(governanceCycleForm?.time);
  const cycleStageLengths = formToCycleStageLengths(governanceCycleForm);
  const dateEntry = formatUTCTime(new Date(governanceCycleForm.startDate));
  const startDate = (hadToRollOver) ? addDaysToDate(dateAtTime(dateEntry, cycleTriggerTime), 1) : dateAtTime(dateEntry, cycleTriggerTime);
  let end = addDaysToDate(startDate, cycleStageLengths[0]);
  let start = startDate;
  const calendar = GovernanceEventName.map((event, index) => {
    end = index === 0 ? end : addDaysToDate(end, cycleStageLengths[index]);
    const ret = {
      title: event,
      start: start.toISOString(),
      end: end.toISOString(),
    };
    start = end;
    return ret;
  });

  return { calendar, cycleTriggerTime, cycleStageLengths } as { calendar: DateEvent[], cycleTriggerTime: string, cycleStageLengths: number[] };
};
