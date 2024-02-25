// cleanup old jobs that have already run
// reschedule nextEvents
import schedule from 'node-schedule';
import logger from '../logging';
import { getAllSpaceConfig } from '../api/helpers/getSpace';
import { scheduleAllCalendarTasks } from './calendar';
import { listScheduledJobs } from './list';
import { doltSys } from '../dolt/doltSys';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

const clearCompletedJobs = () => {
  const jobs = schedule.scheduledJobs;
  Object.keys(jobs).forEach((job) => {
    if (jobs[job].nextInvocation() < new Date()) {
      schedule.cancelJob(job);
      logger.info(`🧼 ${job} 🧼`);
    }
  });
};

export const scheduleCleanup = () => {
  schedule.scheduleJob('🧽 clearCompletedJobs 🧽', '5 0 * * *', () => { // run at 12:05am every day
    logger.info('=========================== 🧽 CLEANUP 🧽 =========================');
    clearCompletedJobs();
    logger.info('===================================================================');
  });
};

const rescheduleJobs = async () => {
  const autoSpaces = await getAllSpaceConfig('autoEnable=1');
  scheduleAllCalendarTasks(autoSpaces);
};

export const scheduleReschedule = () => {
  schedule.scheduleJob('🔄 rescheduleJobs 🔄', '8 0 * * *', () => { // run at 12:08am every day
    logger.info('=========================== 🔄 RESCHEDULE 🔄 =======================');
    rescheduleJobs();
    logger.info('===================================================================');
    listScheduledJobs();
  });
};

export const scheduleDoltTransactionCommit = () => {
  schedule.scheduleJob('📝 doltTransactionCommit 📝', '15 0 * * *', () => { // run at 12:15am every day
    logger.info('=========================== 📝 COMMIT 📝 ===========================');
    doltSys.setTransactionCommit();
    logger.info('===================================================================');
  });
};
