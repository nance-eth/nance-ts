import { createCalendarAndCycleInfo } from '../create';

function main() {
  const governanceCycleForm = {
    startDate: '2021-09-01',
    time: {
      hour: 7,
      minute: '00',
      ampm: 'PM',
      timezoneOffset: 300,
    },
    temperatureCheckLength: '3',
    voteLength: '4',
    executionLength: '4',
    delayLength: '3',
  };
  const { calendar, cycleTriggerTime, cycleStageLengths } = createCalendarAndCycleInfo(governanceCycleForm);
  console.log(calendar);
  console.log(cycleTriggerTime);
  console.log(cycleStageLengths);
  const fullDelta = calendar[calendar.length - 1].end.getTime() - calendar[0].start.getTime();
  const fullDeltaDays = fullDelta / (1000 * 60 * 60 * 24);
  const totalCycleDays = cycleStageLengths.reduce((a, b) => { return a + b; }, 0);
  console.log(`fullDelta days = ${fullDeltaDays}`);
  console.log(`totalCycleDays = ${totalCycleDays}`);
}

main();
