import schedule, { scheduledJobs } from 'node-schedule';
import {
  sleep,
  addSecondsToDate
} from './utils';
import config from './config/dev/config.dev';
import { Nance } from './nance';
import logger from './logging';
import { CalendarHandler } from './calendar/CalendarHandler';

let nance: Nance;
const PADDING_VOTE_START_SECONDS = 30;
const PADDING_VOTE_COUNT_SECONDS = 120;

async function setup() {
  nance = new Nance(config);
  await sleep(1000);
  nance.setDiscussionInterval(10);
}

async function scheduleCycle() {
  const calendar = new CalendarHandler('./src/config/dev/dev.ics');
  const cycle = calendar.getNextEvents();
  cycle.forEach((event) => {
    if (event.title === 'Temperature Check') {
      schedule.scheduleJob('temperatureCheckSetup', event.start, () => {
        nance.temperatureCheckSetup(event.end);
      });
      schedule.scheduleJob('temperatureCheckClose', event.end, () => {
        nance.temperatureCheckClose();
      });
    } else if (event.title === 'Snapshot Vote') {
      schedule.scheduleJob('voteSetup', addSecondsToDate(event.start, PADDING_VOTE_START_SECONDS), () => {
        nance.votingSetup(event.start, event.end);
      });
      schedule.scheduleJob('voteClose', addSecondsToDate(event.end, PADDING_VOTE_COUNT_SECONDS), () => {
        nance.votingClose();
        nance.setDiscussionInterval(30);
      });
    }
  });
}

function listScheduledJobs() {
  const jobs = schedule.scheduledJobs;
  logger.debug('=========================== SCHEDULE ==============================');
  Object.keys(jobs).forEach((job) => {
    logger.debug(`${config.name}: ${job} ${new Date(jobs[job].nextInvocation()).toISOString()}`);
  });
  logger.debug('===================================================================');
}

setup();
scheduleCycle().then(async () => {
  await sleep(1000);
  listScheduledJobs();
});

process.on('SIGINT', () => {
  schedule.gracefulShutdown().then(() => { process.exit(0); });
});
