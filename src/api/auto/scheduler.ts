import schedule from 'node-schedule';
import { EVENTS, FIVE_MINUTES_SECONDS, ONE_HOUR_SECONDS } from '../../constants';
import { addSecondsToDate } from '../../utils';
import { DateEvent } from '../../types';
import { deleteTemperatureCheckStartAlert, sendTemperatureCheckRollup, sendTemperatureCheckStartAlert } from './actions/temperatureCheck';
import { SpaceConfig } from '../../dolt/schema';
import { deleteVoteEndAlert, sendQuorumRollup, sendVoteEndAlert, sendVoteRollup, voteClose } from './actions/vote';
import { discordLogin } from '../helpers/discord';
import { getCurrentEvent, getCurrentGovernanceCycleDay } from '../../calendar/events';

const isNotScheduled = (jobName: string) => {
  return !schedule.scheduledJobs[jobName];
};

const scheduleJob = (jobName: string, date: Date, callback: () => void) => {
  const now = new Date();
  if (isNotScheduled(jobName) && date > now) schedule.scheduleJob(jobName, date, callback);
};

const formatJobTitle = (space: string, title: string, date: Date) => {
  return `${space}:${title}:${date.toISOString()}`;
};

export const scheduleEvents = (events: DateEvent[], spaceConfig: SpaceConfig) => {
  const { space, config, dialogHandlerMessageIds } = spaceConfig;
  events.forEach((event) => {
    // =============================================
    // ============= TEMPERATURE CHECK =============
    // =============================================
    if (event.title === EVENTS.TEMPERATURE_CHECK) {
      // Temperature Check start alert
      const temperatureCheckStartAlertTime = addSecondsToDate(event.start, -ONE_HOUR_SECONDS);
      const tcAlertTitle = formatJobTitle(space, 'temperatureCheckStartAlert', temperatureCheckStartAlertTime);
      scheduleJob(tcAlertTitle, temperatureCheckStartAlertTime, () => {
        sendTemperatureCheckStartAlert(config, event.start);
        console.log(`sendTemperatureCheckStartAlert sent for ${space}`);
      });

      // Temperature Check rollup
      const tcRollupTitle = formatJobTitle(space, 'temperatureCheckRollup', event.start);
      scheduleJob(tcRollupTitle, event.start, () => {
        sendTemperatureCheckRollup(config, event.start);
        console.log(`sendTemperatureCheckRollup sent for ${space}`);
      });

      // Delete Temperature Check start alert
      const temperatureCheckStartAlertDeleteTime = addSecondsToDate(event.start, FIVE_MINUTES_SECONDS);
      const tcDeleteAlertTitle = formatJobTitle(space, 'deleteTemperatureCheckStartAlert', temperatureCheckStartAlertDeleteTime);
      scheduleJob(tcDeleteAlertTitle, temperatureCheckStartAlertDeleteTime, () => {
        deleteTemperatureCheckStartAlert(config, dialogHandlerMessageIds.temperatureCheckStartAlert);
        console.log(`deleteTemperatureCheckStartAlert for ${space}`);
      });
    }

    // =============================================
    // =============== SNAPSHOT VOTE ===============
    // =============================================

    if (event.title === EVENTS.SNAPSHOT_VOTE) {
      // Snapshot vote rollup
      const svRollupTitle = formatJobTitle(space, 'snapshotVoteRollup', event.start);
      scheduleJob(svRollupTitle, event.start, () => {
        sendVoteRollup(config, event.end);
        console.log(`sendVoteRollup sent for ${space}`);
      });

      // Send Snapshot Quorum alert
      const svQuorumAlertTime = addSecondsToDate(event.start, -4 * ONE_HOUR_SECONDS);
      const svQuorumAlertTitle = formatJobTitle(space, 'snapshotQuorumAlert', svQuorumAlertTime);
      scheduleJob(svQuorumAlertTitle, svQuorumAlertTime, () => {
        sendQuorumRollup(config, event.end);
        console.log(`sendQuorumRollup sent for ${space}`);
      });

      // Send Snapshot Vote end alert
      const svEndAlertTime = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      const svEndAlertTitle = formatJobTitle(space, 'snapshotVoteEndAlert', event.end);
      scheduleJob(svEndAlertTitle, svEndAlertTime, () => {
        sendVoteEndAlert(config, event.end);
        console.log(`sendVoteEndAlert sent for ${space}`);
      });

      // Snapshot Vote close
      const svEndRollupTitle = formatJobTitle(space, 'snapshotVoteClose', event.end);
      scheduleJob(svEndRollupTitle, event.end, () => {
        voteClose(config);
        console.log(`voteClose sent for ${space}`);
      });

      // Send Snapshot Vote results rollup
      const svResultsRollupTitle = formatJobTitle(space, 'snapshotVoteResultsRollup', event.end);
      scheduleJob(svResultsRollupTitle, event.end, () => {
        sendVoteRollup(config, event.end);
        console.log(`sendVoteRollup sent for ${space}`);
      });

      // Delete Snapshot Vote end alert
      const snapshotVoteStartAlertDeleteTime = addSecondsToDate(event.end, FIVE_MINUTES_SECONDS);
      const svDeleteAlertTitle = formatJobTitle(space, 'deleteSnapshotVoteStartAlert', snapshotVoteStartAlertDeleteTime);
      scheduleJob(svDeleteAlertTitle, snapshotVoteStartAlertDeleteTime, () => {
        deleteVoteEndAlert(config, dialogHandlerMessageIds.votingEndAlert);
        console.log(`deleteVoteEndAlert for ${space}`);
      });
    }
  });
};

export const scheduleDailyAlerts = (spaceConfig: SpaceConfig) => {
  const { space, config, cycleTriggerTime, calendar, cycleStageLengths, currentGovernanceCycle } = spaceConfig;
  const [hours, minutes] = cycleTriggerTime.split(':').map((str) => { return Number(str); });
  const cronNotation = `${minutes} ${hours} * * *`;
  schedule.scheduleJob(`${space}:dailyAlerts`, cronNotation, async () => {
    const now = new Date();
    const currentEvent = getCurrentEvent(calendar, cycleStageLengths, now);
    if (!currentEvent) return;
    const currentGovernanceCycleDay = getCurrentGovernanceCycleDay(currentEvent, cycleStageLengths, now);
    const dialogHandler = await discordLogin(config);
    await dialogHandler.sendImageReminder(currentGovernanceCycleDay, currentGovernanceCycle, currentEvent.title, currentEvent.end);
    console.log(`dailyAlerts sent for ${space}`);
    console.log(`next innvocation at ${schedule.scheduledJobs[`${space}:dailyAlerts`].nextInvocation().toISOString()}`);
  });
};

export const gracefulShutdown = () => {
  schedule.gracefulShutdown().then(() => {
    console.log('\nGracefully shutting down scheduler\n');
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  gracefulShutdown();
});

process.on('SIGINT', () => {
  gracefulShutdown();
});
