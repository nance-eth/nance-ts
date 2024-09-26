import schedule from 'node-schedule';
import { getAllSpaceConfig } from '../api/helpers/getSpace';
import * as tasks from '../tasks';
import { TASKS } from '../constants';
import { getNextEvents } from '../calendar/events';
import { scheduleCalendarTasks } from './calendar';
import { listScheduledJobs } from './list';
import { scheduleCleanup, scheduleReschedule } from './maintenance';
import { initializePools } from '@/dolt/pools';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

async function main() {
  await initializePools();
  const autoSpaces = await getAllSpaceConfig('autoEnable=1');
  autoSpaces.forEach((spaceConfig, index) => {
    const { space, cycleStartReference, cycleStageLengths, config } = spaceConfig;
    const cycleTriggerTime = cycleStartReference?.toISOString().split('T')[1] || "00:00:00";
    const [hours, minutes] = cycleTriggerTime.split(':').map((str) => { return Number(str); });
    // add some random seconds to the cron notation to avoid all spaces running at the same time
    const seconds = Math.floor(Math.random() * 20);
    const cronNotation = `${seconds} ${minutes} ${hours} * * *`;
    schedule.scheduleJob(`${space}:${TASKS.sendDailyAlert}`, cronNotation, async () => {
      try { await tasks.sendDailyAlert(space); } catch (e) { console.error(e); }
    });
    // schedule all calendar based events
    if (cycleStartReference && cycleStageLengths) {
      const now = new Date();
      const events = getNextEvents(cycleStartReference, cycleStageLengths, now);
      scheduleCalendarTasks(space, config, events);
    }
    // schedule dolt push with some offset so not always at the same time
    const offset = (minutes + index) % 60;
    const pushCronNotation = `${offset} 0 * * *`;
    schedule.scheduleJob(`${space}:${TASKS.commitAndPush}`, pushCronNotation, async () => {
      await tasks.commitAndPush(space);
    });
  });
  scheduleCleanup();
  scheduleReschedule();
  listScheduledJobs();
}

main();
