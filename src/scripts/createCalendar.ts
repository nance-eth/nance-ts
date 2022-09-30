import fs from 'fs';
import { dateToArray, addSecondsToDate } from '../utils';

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

  type EventDateTimes = {
    // number[] = [year, month, day, hour, minute, second]
    temperatureCheck?: { 
      start: number[];
      end: number[];
    };
    vote?: { 
      start: number[];
      end: number[];
    };
    execution?: { 
      start: number[];
      end: number[];
    };
    delay?: { 
      start: number[];
      end: number[];
    };
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
      start: [2022, 9, 22, 16, 0, 0],
      end: [2022, 9, 24, 16, 0, 0]
    },
    vote: {
      start: [2022, 9, 25, 16, 0, 0],
      end: [2022, 9, 28, 16, 0, 0]
    },
    execution: {
      start: [2022, 9, 29, 16, 0, 0],
      end: [2022, 10, 2, 16, 0, 0]
    },
    delay: {
      start: [2022, 10, 3, 16, 0, 0],
      end: [2022, 10, 5, 16, 0, 0]
    }
  };
  
  const { error, value } = ics.createEvents(
    events((TEST) ? undefined : eventDateTimes));
  if (error) {
    console.log(error);
  };

  fs.writeFileSync(`./src/config/${orgName}/${orgName}.ics`, value);
}

createCalendar(
  (process.argv[2] === undefined) ? undefined : process.argv[2], process.argv[2] === undefined)
