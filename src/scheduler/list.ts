import schedule from 'node-schedule';
import logger from '../logging';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

export const listScheduledJobs = () => {
  const jobs = schedule.scheduledJobs;
  logger.info('===================================================================');
  logger.info(`============ current time is ${new Date().toISOString()} =============`);
  logger.info('===================================================================');
  logger.info('=========================== SCHEDULE ==============================');
  Object.keys(jobs).forEach((job) => {
    const time = jobs[job].nextInvocation()?.toISOString();
    logger.info(`${job.padEnd(40)} || ${time}`);
  });
  logger.info('===================================================================');
};
