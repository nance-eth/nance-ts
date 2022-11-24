import schedule from 'node-schedule';
import {
  sleep,
  addSecondsToDate,
  downloadImages
} from './utils';
import { Nance } from './nance';
import { NanceExtensions } from './extensions';
import logger from './logging';
import { getConfig, calendarPath } from './configLoader';
import { CalendarHandler } from './calendar/CalendarHandler';
import { NanceConfig } from './types';

let nance: Nance;
let nanceExt: NanceExtensions;
let config: NanceConfig;

const PADDING_VOTE_START_SECONDS = 30;
const PADDING_VOTE_COUNT_SECONDS = 120;
const ONE_HOUR_SECONDS = 1 * 60 * 60;

async function setup() {
  config = await getConfig();
  nance = new Nance(config);
  nanceExt = new NanceExtensions(nance);
}

async function getReminderImages() {
  downloadImages(config.reminder.imagesCID, config.reminder.images);
}

async function scheduleCycle() {
  const calendar = new CalendarHandler(calendarPath(config));
  const cycle = calendar.getNextEvents();
  logger.debug(cycle);
  if (CalendarHandler.shouldSendDiscussion(cycle)) { nance.setDiscussionInterval(30); }
  const now = new Date();
  cycle.forEach((event) => {
    if (event.start <= now && event.end <= now) { return; }
    if (event.title.includes('Reminder:')) {
      const [, day, type] = event.title.split(':');
      schedule.scheduleJob(`Day ${day} ${type} reminder`, event.start, () => {
        nance.sendImageReminder(day, type);
      });
    }
    if (event.title === 'Temperature Check') {
      if (!event.inProgress) {
        // start reminder
        const reminderDate = addSecondsToDate(event.start, -ONE_HOUR_SECONDS);
        schedule.scheduleJob('temperatureCheckSetup REMINDER', reminderDate, () => {
          nance.reminder(event.title, event.start, 'start');
        });
        schedule.scheduleJob('temperatureCheckSetup', event.start, () => {
          nance.temperatureCheckSetup(event.end);
          nance.clearDiscussionInterval();
        });
      }
      // end reminder
      const reminderDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      schedule.scheduleJob('temperatureCheckClose REMINDER', reminderDate, () => {
        nance.reminder(event.title, event.end, 'end');
      });
      schedule.scheduleJob('temperatureCheckClose', event.end, () => {
        nance.temperatureCheckClose();
      });
    } else if (event.title === 'Snapshot Vote') {
      if (!event.inProgress) {
        schedule.scheduleJob('voteSetup', addSecondsToDate(event.start, PADDING_VOTE_START_SECONDS), () => {
          nance.votingSetup(event.start, event.end).then((proposals) => {
            if (proposals) nanceExt.pushNewCycle(proposals);
          });
        });
      }
      // end reminder
      const reminderDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      schedule.scheduleJob('voteClose REMINDER', reminderDate, () => {
        nance.reminder(event.title, event.end, 'end', `${config.snapshot.base}/${config.snapshot.space}`);
      });
      schedule.scheduleJob('voteClose', addSecondsToDate(event.end, PADDING_VOTE_COUNT_SECONDS), () => {
        nance.votingClose().then((proposals) => {
          if (proposals) nanceExt.updateCycle(proposals, 'vote complete.');
        });
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

setup().then(() => {
  getReminderImages();
  scheduleCycle().then(async () => {
    await sleep(1000);
    listScheduledJobs();
  });
});

process.on('SIGINT', () => {
  schedule.gracefulShutdown().then(() => { process.exit(0); });
});
