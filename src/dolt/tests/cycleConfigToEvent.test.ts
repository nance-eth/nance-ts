import { addDaysToDate } from '../../utils';
import { getCycleStartDays, getStageIndex, getEventDates } from '../helpers/cycleConfigToDateEvent';
import { SpaceConfig } from '../schema';

const realCycleCurrentDay = 3;

const mockConfig = {
  cycleCurrentDay: 13,
  cycleTriggerTime: '00:00:00',
  cycleStageLengths: [3, 4, 4, 3],
} as SpaceConfig;

const mockNow = addDaysToDate(new Date(), mockConfig.cycleCurrentDay - realCycleCurrentDay + 1);

async function main() {
  const cycleStartDays = getCycleStartDays(mockConfig);
  console.log('ctycleStartDays', cycleStartDays);
  const stageIndex = getStageIndex(mockConfig, cycleStartDays);
  console.log(getEventDates(mockNow, mockConfig, cycleStartDays, stageIndex));
}

main();
