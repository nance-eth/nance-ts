import schedule, { scheduledJobs } from 'node-schedule';
import {
  sleep,
  addSecondsToDate
} from './utils';
import { Nance } from './nance';
import logger from './logging';
import { getConfig, calendarPath } from './configLoader';
import { CalendarHandler } from './calendar/CalendarHandler';

let nance: Nance;
let config: any;

const PADDING_VOTE_START_SECONDS = 30;
const PADDING_VOTE_COUNT_SECONDS = 120;
const ONE_HOUR_SECONDS = 1 * 60 * 60;

async function setup() {
  config = await getConfig();
  nance = new Nance(config);
  await sleep(1000);
}

async function scheduleCycle() {
  const calendar = new CalendarHandler(calendarPath);
  const cycle = calendar.getNextEvents();
  cycle.forEach((event) => {
    if ((event.inProgress) && (event.title === 'Execution' || event.title === 'Delay Period')) {
      nance.setDiscussionInterval(30);
    }
    if (event.title === 'Temperature Check') {
      if (!event.inProgress) {
        schedule.scheduleJob('temperatureCheckSetup', event.start, () => {
          nance.temperatureCheckSetup(event.end);
        });
      }
      schedule.scheduleJob('temperatureCheckClose', event.end, () => {
        nance.temperatureCheckClose();
      });
    } else if (event.title === 'Snapshot Vote') {
      if (!event.inProgress) {
        schedule.scheduleJob('voteSetup', addSecondsToDate(event.start, PADDING_VOTE_START_SECONDS), () => {
          nance.votingSetup(event.start, event.end);
        });
      }
      schedule.scheduleJob('voteClose', addSecondsToDate(event.end, PADDING_VOTE_COUNT_SECONDS), () => {
        nance.votingClose();
        nance.setDiscussionInterval(30);
      });
    }
    // reminder for end of each event
    schedule.scheduleJob(`${event.title} *reminder*`, addSecondsToDate(event.end, -ONE_HOUR_SECONDS), () => {
      nance.reminder(event.title, event.end);
    });
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

setup().then(() => {
  scheduleCycle().then(async () => {
    await sleep(1000);
    listScheduledJobs();
  });
});

process.on('SIGINT', () => {
  schedule.gracefulShutdown().then(() => { process.exit(0); });
});
