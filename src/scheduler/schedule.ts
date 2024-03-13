import schedule from 'node-schedule';
import { getAllSpaceConfig } from '../api/helpers/getSpace';
import * as tasks from '../tasks';
import { TASKS } from '../constants';
import { getNextEvents } from '../calendar/events';
import { scheduleCalendarTasks } from './calendar';
import { listScheduledJobs } from './list';
import { scheduleCleanup, scheduleReschedule } from './maintenance';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

async function main() {
  const autoSpaces = await getAllSpaceConfig('autoEnable=1');
  autoSpaces.forEach((spaceConfig, index) => {
    const { space, cycleTriggerTime, cycleStageLengths, calendar, config } = spaceConfig;
    // setup sendDailyAlert, can be a calendar or juicebox based alert
    const [hours, minutes] = cycleTriggerTime.split(':').map((str) => { return Number(str); });
    const cronNotation = `${minutes} ${hours} * * *`;
    const jobType = (calendar) ? TASKS.sendDailyAlert : TASKS.sendDailyJBAlert;
    const jobFunc = (calendar) ? tasks.sendDailyAlert : tasks.sendDailyJBAlert;
    schedule.scheduleJob(`${space}:${jobType}`, cronNotation, async () => {
      await jobFunc(space);
    });
    // schedule all calendar based events
    if (calendar) {
      const now = new Date();
      const events = getNextEvents(calendar, cycleStageLengths, now);
      scheduleCalendarTasks(space, config, events);
    }
    // schedule dolt push with some offset so not always at the same time
    const offset = (minutes + index) % 60;
    const pushCronNotation = `${offset} 0 * * *`;
    schedule.scheduleJob(`${space}:${TASKS.commitAndPush}`, pushCronNotation, async () => {
      await tasks.commitAndPush(space, config);
    });
  });
  scheduleCleanup();
  scheduleReschedule();
  listScheduledJobs();
}

main();
