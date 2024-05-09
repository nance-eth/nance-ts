/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable quote-props */
import { DateEvent } from '@nance/nance-sdk';
import { getCurrentEvent, getCurrentGovernanceCycleDay, getNextEvents } from '../events';
import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { pools } from '../../dolt/pools';
import { addDaysToDate, dateAtTime, sleep } from '../../utils';

const SPACE = "juicebox";

async function main() {
  await sleep(2000);
  const doltSys = new DoltSysHandler(pools.nance_sys);
  const spaceConfig = await doltSys.getSpaceConfig(SPACE);

  // const dateToTest = new Date('2023-11-21T00:00:00.000Z');
  let dateToTest = dateAtTime(new Date(), "00:00:00");
  for (let i = 0; i <= 14; i += 1) {
    if (i > 0) dateToTest = addDaysToDate(dateToTest, 1);
    if (!spaceConfig.cycleStartReference || !spaceConfig.cycleStageLengths) return;
    console.log(`========= TESTING ${dateToTest.toISOString()} ==========`);
    const nextEvents = getNextEvents(spaceConfig.cycleStartReference, spaceConfig.cycleStageLengths, dateToTest);
    console.log('nextEvents', nextEvents);
    const currentEvent = getCurrentEvent(spaceConfig.cycleStartReference, spaceConfig.cycleStageLengths, dateToTest);
    console.log('currentEvent', currentEvent);

    if (currentEvent) {
      const currentGovernanceCycleDay = getCurrentGovernanceCycleDay(currentEvent, spaceConfig.cycleStageLengths, dateToTest);
      console.log('currentGovernanceCycleDay', currentGovernanceCycleDay);
    }
    console.log('====================================================');
  }
}

main();
