/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable quote-props */
import { DateEvent } from '../../types';
import { getCurrentEvent, getCurrentGovernanceCycleDay, getNextEvents } from '../events';

const spaceInfo = {
  cycleStageLengths: [3, 4, 4, 3],
  cycleTriggerTime: '00:00:00',
  calendar: [
    {
      "title": "Temperature Check",
      "start": "2023-08-12T00:00:00.000Z",
      "end": "2023-08-15T00:00:00.000Z"
    },
    {
      "title": "Snapshot Vote",
      "start": "2023-08-15T00:00:00.000Z",
      "end": "2023-08-19T00:00:00.000Z"
    },
    {
      "title": "Execution",
      "start": "2023-08-19T00:00:00.000Z",
      "end": "2023-08-23T00:00:00.000Z"
    },
    {
      "title": "Delay",
      "start": "2023-08-23T00:00:00.000Z",
      "end": "2023-08-26T00:00:00.000Z"
    }
  ],
};

// const dateToTest = new Date('2023-11-01T00:00:00.000Z');
const dateToTest = new Date();

// const nextEvents = getNextEvents(spaceInfo.calendar as unknown as DateEvent[], spaceInfo.cycleStageLengths, dateToTest);
// console.log('nextEvents', nextEvents);

const currentEvent = getCurrentEvent(spaceInfo.calendar as unknown as DateEvent[], spaceInfo.cycleStageLengths, dateToTest);
console.log('currentEvent', currentEvent);

if (currentEvent) {
  const currentGovernanceCycleDay = getCurrentGovernanceCycleDay(currentEvent, spaceInfo.cycleStageLengths, dateToTest);
  console.log('currentGovernanceCycleDay', currentGovernanceCycleDay);
}
