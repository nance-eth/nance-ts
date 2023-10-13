import schedule from 'node-schedule';
import { getAllSpaceConfig } from '../api/helpers/getSpace';
import * as tasks from '../tasks/_tasks';
import { TASKS } from '../constants';
import logger from '../logging';
import { getNextEvents } from '../calendar/events';
import { scheduleCalendarTasks } from './calendar';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

export const listScheduledJobs = () => {
  const jobs = schedule.scheduledJobs;
  logger.info('===================================================================');
  logger.info(`============ current time is ${new Date().toISOString()} =============`);
  logger.info('===================================================================');
  logger.info('=========================== SCHEDULE ==============================');
  Object.keys(jobs).forEach((job, index) => {
    const time = jobs[job].nextInvocation()?.toISOString();
    logger.info(`${job.padEnd(50)} || ${time}`);
  });
  logger.info('===================================================================');
};

async function main() {
  const autoSpaces = await getAllSpaceConfig('autoEnable=1');
  autoSpaces.forEach((spaceConfig) => {
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
      scheduleCalendarTasks(config, events);
    }
  });
  listScheduledJobs();
}

main();
