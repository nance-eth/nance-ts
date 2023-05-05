import schedule from 'node-schedule';
import {
  sleep,
  addSecondsToDate,
  downloadImages,
  myProvider,
} from './utils';
import { Nance } from './nance';
import { NanceTreasury } from './treasury';
import logger from './logging';
import { getConfig, getCalendar } from './configLoader';
import { CalendarHandler } from './calendar/CalendarHandler';
import { NanceConfig } from './types';

let nance: Nance;
let treasury: NanceTreasury;
let config: NanceConfig;

const PADDING_VOTE_START_SECONDS = 30;
const PADDING_VOTE_COUNT_SECONDS = 120;
const ONE_HOUR_SECONDS = 1 * 60 * 60;

async function setup() {
  config = await getConfig();
  nance = new Nance(config);
  treasury = new NanceTreasury(config, nance.dProposalHandler, myProvider('mainnet'));
}

async function getReminderImages() {
  downloadImages(config.discord.reminder.imagesCID, config.discord.reminder.imageNames);
}

function isNotScheduled(jobName: string) {
  return !schedule.scheduledJobs[jobName];
}

async function scheduleCycle() {
  const calendar = new CalendarHandler(getCalendar(config));
  const cycle = calendar.getNextEvents();
  if (CalendarHandler.shouldSendDiscussion(cycle)) { nance.setDiscussionInterval(30); }
  const now = new Date();
  cycle.forEach((event) => {
    if (event.start <= now && event.end <= now) { return; }
    if (event.title.includes('Reminder:')) {
      const [, day, type] = event.title.split(':');
      const reminderTitle = `Day ${day} ${type} reminder`;
      if (isNotScheduled(reminderTitle)) {
        schedule.scheduleJob(reminderTitle, event.start, () => {
          nance.sendImageReminder(day, type);
        });
      }
    }
    if (event.title === 'Temperature Check') {
      // start reminder
      const reminderDateStart = addSecondsToDate(event.start, -ONE_HOUR_SECONDS);
      if (isNotScheduled('temperatureCheckSetup REMINDER')) {
        schedule.scheduleJob('temperatureCheckSetup REMINDER', reminderDateStart, () => {
          nance.reminder(event.title, event.start, 'start');
        });
      }
      // increment governanceCycle 90 seconds before tempertureCheck starts
      const governanceCycleIncTime = addSecondsToDate(event.start, (config.name === 'waterbox') ? -3 : -90);
      if (isNotScheduled('increment governanceCycle')) {
        schedule.scheduleJob('increment governanceCycle', governanceCycleIncTime, async () => {
          treasury.getCycleInformation().then((cycleInfo) => {
            nance.incrementGovernanceCycle(cycleInfo);
          }).catch((err) => {
            logger.error(err);
          });
        });
      }
      // temperatureCheck itself
      if (isNotScheduled('temperatureCheckSetup')) {
        schedule.scheduleJob('temperatureCheckSetup', event.start, () => {
          nance.temperatureCheckSetup(event.end);
          nance.clearDiscussionInterval();
        });
      }
      // end reminder
      if (isNotScheduled('temperatureCheckClose REMINDER')) {
        const reminderDateEnd = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
        schedule.scheduleJob('temperatureCheckClose REMINDER', reminderDateEnd, () => {
          nance.reminder(event.title, event.end, 'end');
        });
      }
      if (isNotScheduled('temperatureCheckClose')) {
        schedule.scheduleJob('temperatureCheckClose', event.end, () => {
          nance.temperatureCheckClose();
        });
      }
    } else if (event.title === 'Snapshot Vote') {
      if (isNotScheduled('voteSetup')) {
        schedule.scheduleJob('voteSetup', addSecondsToDate(event.start, PADDING_VOTE_START_SECONDS), () => {
          nance.votingSetup(event.end);
        });
      }
      // end reminder
      if (isNotScheduled('voteClose REMINDER')) {
        const reminderDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
        schedule.scheduleJob('voteClose REMINDER', reminderDate, () => {
          nance.reminder(event.title, event.end, 'end', `${config.snapshot.base}`);
        });
      }
      if (isNotScheduled('voteClose')) {
        schedule.scheduleJob('voteClose', addSecondsToDate(event.end, PADDING_VOTE_COUNT_SECONDS), () => {
          nance.votingClose();
          nance.setDiscussionInterval(30);
        });
      }
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

function clearCompletedJobs() {
  const jobs = schedule.scheduledJobs;
  Object.keys(jobs).forEach((job) => {
    if (job[0] === 'cleanup') { return; }
    if (jobs[job].nextInvocation() < new Date()) {
      logger.debug(`Clearing job ${job}`);
      jobs[job].cancel();
    }
  });
}

async function scheduleCleanup() {
  schedule.scheduleJob('cleanup', '0 0 * * 0', async () => {
    logger.debug('========================== 🧽 CLEANUP 🧽 ==========================');
    clearCompletedJobs();
    scheduleCycle().then(async () => {
      listScheduledJobs();
    });
    logger.debug('===================================================================');
    console.log('\n'.repeat(20));
  });
}

setup().then(() => {
  getReminderImages();
  scheduleCycle().then(async () => {
    await sleep(1000);
    scheduleCleanup();
    listScheduledJobs();
  });
});

process.on('SIGINT', () => {
  schedule.gracefulShutdown().then(() => { process.exit(0); });
});
