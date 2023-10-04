import schedule from 'node-schedule';
import logger from '../../logging';

export const listScheduledJobs = () => {
  const jobs = schedule.scheduledJobs;
  console.log('=========================== SCHEDULE ==============================');
  Object.keys(jobs).forEach((job) => {
    console.log(job);
    if (job.includes('daily')) {
      console.log(jobs[job].nextInvocation().toISOString());
    }
  });
  console.log('===================================================================');
};
