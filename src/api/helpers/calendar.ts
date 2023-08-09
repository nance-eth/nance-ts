import * as ICS from 'ics';
import { dateToArray, addSecondsToDate, addDaysToDateArray } from '../../utils';
import { GovernanceCycleForm } from '../../types';

type EventDateTime = {
  start: [number, number, number, number, number, number];
  end: [number, number, number, number, number, number];
};

type EventDateTimes = {
  // number[] = [year, month, day, hour, minute, second]
  temperatureCheck: EventDateTime;
  vote: EventDateTime;
  execution: EventDateTime;
  delay: EventDateTime;
};

function formToEventDateTimes(cycle: GovernanceCycleForm) {
  const {
    time: { ampm, hour, minute, timezoneOffset },
    startDate,
    temperatureCheckLength,
    voteLength,
    delayLength,
    executionLength,
  } = cycle;
  console.log(cycle);
  const temperatureCheckStart = dateToArray(
    addSecondsToDate(
      new Date(startDate),
      hour * 60 * 60 + Number(minute) * 60 + (ampm === 'PM' ? 12 * 60 * 60 : 0)
    )
  );
  const temperatureCheckEnd = addDaysToDateArray(temperatureCheckStart, Number(temperatureCheckLength));
  return {
    temperatureCheck: {
      start: temperatureCheckStart,
      end: temperatureCheckEnd,
    },
    vote: {
      start: temperatureCheckEnd,
      end: addDaysToDateArray(temperatureCheckEnd, Number(voteLength)),
    },
    execution: {
      start: addDaysToDateArray(temperatureCheckEnd, Number(voteLength)),
      end: addDaysToDateArray(temperatureCheckEnd, Number(voteLength) + Number(executionLength)),
    },
    delay: {
      start: addDaysToDateArray(temperatureCheckEnd, Number(voteLength) + Number(executionLength)),
      end: addDaysToDateArray(temperatureCheckEnd, Number(voteLength) + Number(executionLength) + Number(delayLength)),
    }
  };
}

function eventsDateTimesToICSEvents(eventDateTimes: EventDateTimes, interval: number) {
  return [
    {
      title: 'Temperature Check',
      startInputType: 'utc' as unknown as 'utc',
      startOutputType: 'utc' as unknown as 'utc',
      start: eventDateTimes.temperatureCheck.start as unknown as ICS.DateArray,
      end: eventDateTimes.temperatureCheck.end as unknown as ICS.DateArray,
      recurrenceRule: `FREQ=DAILY;INTERVAL=${interval}`
    },
    {
      title: 'Snapshot Vote',
      startInputType: 'utc' as unknown as 'utc',
      startOutputType: 'utc' as unknown as 'utc',
      start: eventDateTimes.vote.start as unknown as ICS.DateArray,
      end: eventDateTimes.vote.end as unknown as ICS.DateArray,
      recurrenceRule: `FREQ=DAILY;INTERVAL=${interval}`
    },
    {
      title: 'Execution',
      startInputType: 'utc' as unknown as 'utc',
      startOutputType: 'utc' as unknown as 'utc',
      start: eventDateTimes.execution.start as unknown as ICS.DateArray,
      end: eventDateTimes.execution.end as unknown as ICS.DateArray,
      recurrenceRule: `FREQ=DAILY;INTERVAL=${interval}`
    },
    {
      title: 'Delay Period',
      startInputType: 'utc' as unknown as 'utc',
      startOutputType: 'utc' as unknown as 'utc',
      start: eventDateTimes.delay.start as unknown as ICS.DateArray,
      end: eventDateTimes.delay.end as unknown as ICS.DateArray,
      recurrenceRule: `FREQ=DAILY;INTERVAL=${interval}`
    }
  ];
}

export function createCalendarFromForm(cycle: GovernanceCycleForm) {
  const eventDateTimes = formToEventDateTimes(cycle);
  const interval = Number(cycle.temperatureCheckLength) + Number(cycle.voteLength) + Number(cycle.executionLength) + Number(cycle.delayLength);
  const events = eventsDateTimesToICSEvents(eventDateTimes, interval);
  const { value } = ICS.createEvents(events);
  return value || '';
}
