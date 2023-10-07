import schedule from 'node-schedule';
import { getAllSpaceConfig, getSpaceConfig } from '../api/helpers/getSpace';
import { getCurrentEvent, getCurrentGovernanceCycleDay } from '../calendar/events';
import { discordLogin } from '../api/helpers/discord';
import { juiceboxTime } from '../api/helpers/juicebox';
import { SpaceConfig } from '../dolt/schema';
import { DateEvent } from '../types';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

const juiceboxTimeBasedDaysRemaining = [20, 15, 10, 5, 4, 3, 2, 1];

async function sendDailyJucieboxBasedAlert(space: string) {
  console.log('===================================================================');
  console.log(`=============== sending dailyJBAlert for ${space} ================`);
  try {
    // refetch spaceConfig to get latest cycle information
    const { config } = await getSpaceConfig(space);
    const { currentGovernanceCycle, cycleCurrentDay, daysRemainingToSubmitReconfig, end, delay } = await juiceboxTime(config.juicebox.projectId);
    console.log(`currentGovernanceCycleDay: ${cycleCurrentDay}`);
    console.log(`daysRemaining: ${JSON.stringify(daysRemainingToSubmitReconfig)}`);
    if (juiceboxTimeBasedDaysRemaining.includes(daysRemainingToSubmitReconfig)) {
      const endDate = new Date(end);
      const dialogHandler = await discordLogin(config);
      await dialogHandler.sendDailyReminder(cycleCurrentDay, currentGovernanceCycle, '', endDate, delay);
      console.log(`dailyJBAlert sent for ${space}`);
      console.log(`next innvocation at ${schedule.scheduledJobs[`${space}:dailyJBAlert`].nextInvocation().toISOString()}`);
    } else {
      console.log(`no dailyJBAlert sent for ${space}, not included in alert days: ${juiceboxTimeBasedDaysRemaining}`);
    }
  } catch (e) {
    console.error(`error sending dailyJucieboxBasedAlert for ${space}`);
    console.error(e);
  }
  console.log('===================================================================');
}

async function sendDailyAlert(space: string) {
  console.log('===================================================================');
  console.log(`================= sending dailyAlert for ${space} =================`);
  const now = new Date();
  try {
    // refetch spaceConfig to get latest cycle information
    const spaceConfig = await getSpaceConfig(space);
    const { config, currentGovernanceCycle } = spaceConfig;
    const currentEvent = getCurrentEvent(spaceConfig.calendar, spaceConfig.cycleStageLengths, now);
    const currentGovernanceCycleDay = getCurrentGovernanceCycleDay(currentEvent, spaceConfig.cycleStageLengths, now);
    console.log(`currentGovernanceCycleDay: ${currentGovernanceCycleDay}`);
    console.log(`currentEvent: ${JSON.stringify(currentEvent)}`);
    const dialogHandler = await discordLogin(config);
    await dialogHandler.sendDailyReminder(currentGovernanceCycleDay, currentGovernanceCycle, currentEvent.title, currentEvent.end);
    console.log(`dailyAlert sent for ${space}`);
    console.log(`next innvocation at ${schedule.scheduledJobs[`${space}:dailyAlert`].nextInvocation().toISOString()}`);
  } catch (e) {
    console.error(`error sending dailyAlert for ${space}`);
    console.error(e);
  }
  console.log('===================================================================');
}

export const listScheduledJobs = () => {
  const jobs = schedule.scheduledJobs;
  console.log('===================================================================');
  console.log(`============ current time is ${new Date().toISOString()} =============`);
  console.log('===================================================================');
  console.log('=========================== SCHEDULE ==============================');
  Object.keys(jobs).forEach((job, index) => {
    const time = jobs[job].nextInvocation().toISOString();
    console.log(`${index + 1}. ${job.padEnd(25)} || ${time}`);
  });
  console.log('===================================================================');
};

async function main() {
  const autoSpaces = await getAllSpaceConfig('autoEnable=1');
  autoSpaces.forEach((spaceConfig) => {
    const { space, cycleTriggerTime, calendar } = spaceConfig;
    const [hours, minutes] = cycleTriggerTime.split(':').map((str) => { return Number(str); });
    const cronNotation = `${minutes} ${hours} * * *`;
    const jobType = (calendar) ? 'dailyAlert' : 'dailyJBAlert';
    const jobFunc = (calendar) ? sendDailyAlert : sendDailyJucieboxBasedAlert;
    schedule.scheduleJob(`${space}:${jobType}`, cronNotation, () => {
      jobFunc(space);
    });
  });
  listScheduledJobs();
}

main();
