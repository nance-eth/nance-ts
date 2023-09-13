import fs from 'fs';
import { dateToArray, addSecondsToDate, addDaysToDate, formatUTCTime } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ics = require('ics');

export function createCalendar(newOrg?: string, TEST?: boolean) {
  const orgName = (TEST) ? 'waterbox' : newOrg;
  const now = new Date();
  const FREQ = (TEST) ? 'DAILY' : 'WEEKLY';

  const TEST_EXEC_START = now;
  const TEST_EXEC_END = addSecondsToDate(now, 35);
  const TEST_TEMPCHECK_START = addSecondsToDate(now, 60);
  const TEST_TEMPCHECK_END = addSecondsToDate(now, 120);
  const TEST_VOTE_START = addSecondsToDate(now, 125);
  const TEST_VOTE_END = addSecondsToDate(now, 500);
  const TEST_DELAY_START = addSecondsToDate(now, 500);
  const TEST_DELAY_END = addSecondsToDate(now, 600);


  type EventDateTime = {
    start: [number, number, number, number, number, number];
    end: [number, number, number, number, number, number];
  }

  type EventDateTimes = {
    // number[] = [year, month, day, hour, minute, second]
    temperatureCheck?: EventDateTime;
    vote?: EventDateTime;
    execution?: EventDateTime;
    delay?: EventDateTime;
  }

  const getReminders = (event: EventDateTime, name: string, offset: number) => {
    // Convert array dates to Date objects
    console.log(event.start);
    const date1 = new Date(Date.UTC(event.start[0], event.start[1], event.start[2], event.start[3], event.start[4], event.start[5]));
    const date2 = new Date(Date.UTC(event.end[0], event.end[1], event.end[2], event.end[3], event.end[4], event.end[5]));

    // Calculate the time difference in milliseconds
    const timeDifferenceMs = (date2.getTime() - date1.getTime());

    // Convert milliseconds to days
    const elapsedDays = Math.ceil(timeDifferenceMs / (1000 * 60 * 60 * 24));
    console.log(`elapsed days for ${name}: ${elapsedDays}`);
    console.log(date1, date2);
    let reminders = [];
    for (let i = 0; i <= elapsedDays; i++) {
      reminders.push({
        title: `Reminder:${i+1+offset}:${name}`,
        startInputType: 'utc',
        startOutputType: 'utc',
        start: dateToArray(addDaysToDate(date1, i)),
        end: dateToArray(addDaysToDate(date1, i)),
        recurrenceRule: `FREQ=${FREQ};INTERVAL=2`
      });
    }
    return reminders;
  }

  const events = (eventDateTimes?: EventDateTimes) => {
    return [
    {
      title: 'Temperature Check',
      startInputType: 'utc',
      startOutputType: 'utc',
      start: (eventDateTimes) ? eventDateTimes.temperatureCheck?.start : dateToArray(TEST_TEMPCHECK_START),
      end:(eventDateTimes) ? eventDateTimes.temperatureCheck?.end : dateToArray(TEST_TEMPCHECK_END),
      recurrenceRule: `FREQ=${FREQ};INTERVAL=2`
    },
    {
      title: 'Snapshot Vote',
      startInputType: 'utc',
      startOutputType: 'utc',
      start: (eventDateTimes) ? eventDateTimes.vote?.start : dateToArray(TEST_VOTE_START),
      end: (eventDateTimes) ? eventDateTimes.vote?.end : dateToArray(TEST_VOTE_END),
      recurrenceRule: `FREQ=${FREQ};INTERVAL=2`
    },
    {
      title: 'Execution',
      startInputType: 'utc',
      startOutputType: 'utc',
      start: (eventDateTimes) ? eventDateTimes.execution?.start : dateToArray(TEST_EXEC_START),
      end: (eventDateTimes) ? eventDateTimes.execution?.end : dateToArray(TEST_EXEC_END),
      recurrenceRule: `FREQ=${FREQ};INTERVAL=2`
    },
    {
      title: 'Delay Period',
      startInputType: 'utc',
      startOutputType: 'utc',
      start: (eventDateTimes) ? eventDateTimes.delay?.start : dateToArray(TEST_DELAY_START),
      end: (eventDateTimes) ? eventDateTimes.delay?.end : dateToArray(TEST_DELAY_END),
      recurrenceRule: `FREQ=${FREQ};INTERVAL=2`
    }
  ]};

  const eventDateTimes: EventDateTimes = {
    temperatureCheck: {
      start: [2023, 6, 24, 0, 0, 0],
      end: [2023, 6, 26, 0, 0, 0]
    },
    vote: {
      start: [2023, 6, 26, 0, 0, 0],
      end: [2023, 6, 29, 0, 0, 0]
    },
    execution: {
      start: [2023, 6, 29, 0, 0, 0],
      end: [2023, 7, 7, 0, 0, 0]
    },
    // delay: {
    //   start: [2023, 1, 10, 16, 0, 0],
    //   end: [2023, 1, 14, 16, 0, 0]
    // }
  };

  let r = getReminders(eventDateTimes.temperatureCheck!, 'temperature check', 0);
  r = getReminders(eventDateTimes.vote!, 'vote', 3).concat(r);
  r = getReminders(eventDateTimes.execution!, 'execution', 8).concat(r);
  r = r.sort((a, b) => {
    return Number(a.title.split(':')[1]) - Number(b.title.split(':')[1]);
  })
  console.log(r);

  const allEvents = (TEST) ? events() : [...events(eventDateTimes), ...r];

  const { error, value } = ics.createEvents(allEvents);
  if (error) {
    console.log(error);
  };

  fs.writeFileSync(`./src/config/${orgName}/${orgName}.ics`, value);
}

createCalendar(
  (process.argv[2] === undefined) ? undefined : process.argv[2], process.argv[2] === undefined)
