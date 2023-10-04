import { DoltSysHandler } from '../../dolt/doltSysHandler';
import { dbOptions } from '../../dolt/dbConfig';
import { getNextEvents } from '../../calendar/events';
import { scheduleEvents, scheduleDailyAlerts } from './scheduler';
import { listScheduledJobs } from './monitoring';
import { DoltSQL } from '../../dolt/doltSQL';

const nance_sys = new DoltSQL(dbOptions('nance_sys'));
const doltSys = new DoltSysHandler(nance_sys);

async function main() {
  const spaces = await doltSys.getAllSpaceNames('autoEnable=true');
  spaces.forEach((space) => {
    const nextEvents = getNextEvents(space.calendar, space.cycleStageLengths, new Date());
    scheduleDailyAlerts(space);
    scheduleEvents(nextEvents, space);
  });
  listScheduledJobs();
}

main();
