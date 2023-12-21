import schedule from 'node-schedule';
import retry from 'promise-retry';
import { DateEvent, NanceConfig } from '../types';
import { EVENTS, ONE_HOUR_SECONDS, TASKS } from '../constants';
import * as tasks from '../tasks/_tasks';
import { addDaysToDate, addSecondsToDate } from '../utils';
import { SpaceConfig } from '../dolt/schema';
import { getNextEvents } from '../calendar/events';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

const isNotScheduled = (jobName: string) => {
  return !schedule.scheduledJobs[jobName];
};

const scheduleJob = (jobName: string, date: Date, func: () => void) => {
  const now = new Date();
  if (isNotScheduled(jobName) && date > now) {
    schedule.scheduleJob(jobName, date, func);
  }
};

export const scheduleCalendarTasks = async (config: NanceConfig, events: DateEvent[]) => {
  const space = config.name.toLowerCase();
  events.forEach(async (event) => {
    if (event.title === EVENTS.TEMPERATURE_CHECK) {
      // Temperature Check start alert
      const sendTemperatureCheckStartDate = addSecondsToDate(event.start, -ONE_HOUR_SECONDS);
      scheduleJob(`${space}:${TASKS.temperatureCheckStartAlert}`, sendTemperatureCheckStartDate, () => {
        tasks.sendStartOrEndAlert(config, event.start, EVENTS.TEMPERATURE_CHECK, TASKS.temperatureCheckStartAlert, 'start');
      });
      // Delete Temperature Check start alert
      scheduleJob(`${space}:${TASKS.deleteTemperatureCheckStartAlert}`, event.start, () => {
        tasks.deleteStartOrEndAlert(config, TASKS.temperatureCheckStartAlert);
      });
      // Send Temperature Check rollup
      scheduleJob(`${space}:${TASKS.temperatureCheckRollup}`, event.start, () => {
        tasks.temperatureCheckRollup(config, event.end);
      });
      // Send Temperature Check end alert
      const sendTemperatureCheckEndDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      scheduleJob(`${space}:${TASKS.temperatureCheckEndAlert}`, sendTemperatureCheckEndDate, async () => {
        const shouldSendAlert = await tasks.shouldSendAlert(config);
        if (!shouldSendAlert) return;
        tasks.sendStartOrEndAlert(config, event.end, EVENTS.TEMPERATURE_CHECK, TASKS.temperatureCheckEndAlert, 'end');
      });
      // Delete Temperature Check end alert
      scheduleJob(`${space}:${TASKS.deleteTemperatureCheckEndAlert}`, event.end, () => {
        tasks.deleteStartOrEndAlert(config, TASKS.temperatureCheckEndAlert);
      });
      // Temperature Check close
      scheduleJob(`${space}:${TASKS.temperatureCheckClose}`, event.end, () => {
        tasks.temperatureCheckClose(config);
      });
    }
    if (event.title === EVENTS.SNAPSHOT_VOTE) {
      // Vote setup
      const voteSetupDate = addSecondsToDate(event.start, 60);
      scheduleJob(`${space}:${TASKS.voteSetup}`, voteSetupDate, () => {
        // TODO
        // see how Snapshot uploads fail and do a retry
        tasks.voteSetup(config, event.end).then((proposals) => {
          // Send Vote rollup
          if (proposals) {
            tasks.voteRollup(config, event.end, proposals);
          }
        });
      });
      // Send 24hr vote ending alert
      const sendVoteOneDayEndDate = addDaysToDate(event.end, -1);
      scheduleJob(`${space}:${TASKS.voteOneDayEndAlert}`, sendVoteOneDayEndDate, async () => {
        const shouldSendAlert = await tasks.shouldSendAlert(config);
        if (!shouldSendAlert) return;
        tasks.sendStartOrEndAlert(config, event.end, EVENTS.SNAPSHOT_VOTE, TASKS.voteOneDayEndAlert, 'end');
      });
      // Send Vote quorum alert
      const sendVoteQuorumAlertDate = addSecondsToDate(event.end, -4 * ONE_HOUR_SECONDS);
      scheduleJob(`${space}:${TASKS.voteQuorumAlert}`, sendVoteQuorumAlertDate, () => {
        tasks.voteQuorumAlert(config, event.end);
      });
      // Send Vote end alert
      const sendVoteEndDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      scheduleJob(`${space}:${TASKS.voteEndAlert}`, sendVoteEndDate, async () => {
        const shouldSendAlert = await tasks.shouldSendAlert(config);
        if (!shouldSendAlert) return;
        tasks.sendStartOrEndAlert(config, event.end, EVENTS.SNAPSHOT_VOTE, TASKS.voteEndAlert, 'end');
      });
      // Delete Vote end alert
      scheduleJob(`${space}:${TASKS.deleteVoteEndAlert}`, event.end, () => {
        tasks.deleteStartOrEndAlert(config, TASKS.voteEndAlert);
      });
      // Vote close
      const voteCloseDate = addSecondsToDate(event.end, 60); // some time for Snapshot results to settle
      scheduleJob(`${space}:${TASKS.voteClose}`, voteCloseDate, async () => {
        const results = await retry(() => { return tasks.voteClose(config); }, { retries: 3 });
        if (results) {
          tasks.voteResultsRollup(config, results);
        }
      });
    }
    if (event.title === EVENTS.EXECUTION) {
      // Bookkeeping
      const bookkeepingDate = addSecondsToDate(event.start, 5 * 60);
      scheduleJob(`${space}:${TASKS.sendBookkeeping}`, bookkeepingDate, () => {
        tasks.sendBookkeeping(config);
      });
    }
    if (event.title === EVENTS.DELAY) {
      // Increment Governance Cycle 5 seconds before Delay ends
      const incrementGovernanceCycleDate = addSecondsToDate(event.end, -5);
      scheduleJob(`${space}:${TASKS.incrementGovernanceCycle}`, incrementGovernanceCycleDate, () => {
        tasks.incrementGovernanceCycle(space);
      });
    }
  });
};

export const scheduleAllCalendarTasks = async (spaceConfigs: SpaceConfig[]) => {
  spaceConfigs.forEach((spaceConfig) => {
    const { cycleStageLengths, calendar, config } = spaceConfig;
    // schedule all calendar based events
    if (calendar) {
      const now = new Date();
      const events = getNextEvents(calendar, cycleStageLengths, now);
      scheduleCalendarTasks(config, events);
    }
  });
};
