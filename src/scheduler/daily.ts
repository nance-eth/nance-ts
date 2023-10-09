import schedule from 'node-schedule';
import { getAllSpaceConfig } from '../api/helpers/getSpace';
import {
  sendDailyJBAlert,
  sendDailyAlert
} from '../tasks/_tasks';
import { TASKS } from '../constants';
import logger from '../logging';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

export const listScheduledJobs = () => {
  const jobs = schedule.scheduledJobs;
  logger.info('===================================================================');
  logger.info(`============ current time is ${new Date().toISOString()} =============`);
  logger.info('===================================================================');
  logger.info('=========================== SCHEDULE ==============================');
  Object.keys(jobs).forEach((job, index) => {
    const time = jobs[job].nextInvocation().toISOString();
    logger.info(`${index + 1}. ${job.padEnd(30)} || ${time}`);
  });
  logger.info('===================================================================');
};

async function main() {
  const autoSpaces = await getAllSpaceConfig('autoEnable=1');
  autoSpaces.forEach((spaceConfig) => {
    const { space, cycleTriggerTime, calendar } = spaceConfig;
    const [hours, minutes] = cycleTriggerTime.split(':').map((str) => { return Number(str); });
    const cronNotation = `${minutes} ${hours} * * *`;
    const jobType = (calendar) ? TASKS.sendDailyAlert : TASKS.sendDailyJBAlert;
    const jobFunc = (calendar) ? sendDailyAlert : sendDailyJBAlert;
    schedule.scheduleJob(`${space}:${jobType}`, cronNotation, () => {
      jobFunc(space);
    });
  });
  listScheduledJobs();
}

main();
