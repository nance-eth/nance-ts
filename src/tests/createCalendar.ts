import fs from 'fs';
import { dateToArray, addSecondsToDate } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ics = require('ics');

const now = new Date();
const eventOffsetMinutes = 2;

const events = [
  {
    title: 'Temperature Check',
    startInputType: 'utc',
    startOutputType: 'utc',
    start: dateToArray(addSecondsToDate(now, eventOffsetMinutes * 60)),
    end: dateToArray(addSecondsToDate(now, 2 * eventOffsetMinutes * 60)),
    recurrenceRule: 'FREQ=DAILY;INTERVAL=2'
  },
  {
    title: 'Snapshot Vote',
    startInputType: 'utc',
    startOutputType: 'utc',
    start: dateToArray(addSecondsToDate(now, 3 * eventOffsetMinutes * 60)),
    end: dateToArray(addSecondsToDate(now, 4 * eventOffsetMinutes * 60)),
    recurrenceRule: 'FREQ=DAILY;INTERVAL=2'
  }
  // {
  //   title: 'Execution',
  //   startInputType: 'utc',
  //   startOutputType: 'utc',
  //   start: dateToArray(addSecondsToDate(now, 3 * eventOffsetMinutes * 60)),
  //   end: dateToArray(addSecondsToDate(now, 4 * eventOffsetMinutes * 60)),
  //   recurrenceRule: 'FREQ=DAILY;INTERVAL=2'
  // },
  // {
  //   title: 'Delay Period',
  //   startInputType: 'utc',
  //   startOutputType: 'utc',
  //   start: dateToArray(addSecondsToDate(now, 4 * eventOffsetMinutes * 60)),
  //   end: dateToArray(addSecondsToDate(now, 5 * eventOffsetMinutes * 60)),
  //   recurrenceRule: 'FREQ=DAILY;INTERVAL=2'
  // }
];

console.log(events);

const { error, value } = ics.createEvents(events);
if (error) {
  console.log(error);
}

fs.writeFileSync('./src/config/dev/dev.ics', value);
