/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable quote-props */
import { DateEvent } from '../../types';
import { getCurrentEvent, getCurrentGovernanceCycleDay, getNextEvents } from '../events';
import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { pools } from '../../dolt/pools';

async function main() {
  const doltSys = new DoltSysHandler(pools.nance_sys);
  const spaceConfig = await doltSys.getSpaceConfig(process.env.CONFIG || '');

  // const dateToTest = new Date('2023-11-01T00:00:00.000Z');
  const dateToTest = new Date();

  // const nextEvents = getNextEvents(spaceInfo.calendar as unknown as DateEvent[], spaceInfo.cycleStageLengths, dateToTest);
  // console.log('nextEvents', nextEvents);

  const currentEvent = getCurrentEvent(spaceConfig.calendar as unknown as DateEvent[], spaceConfig.cycleStageLengths, dateToTest);
  console.log('currentEvent', currentEvent);

  if (currentEvent) {
    const currentGovernanceCycleDay = getCurrentGovernanceCycleDay(currentEvent, spaceConfig.cycleStageLengths, dateToTest);
    console.log('currentGovernanceCycleDay', currentGovernanceCycleDay);
  }
}

main();
