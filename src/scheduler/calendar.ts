import schedule from 'node-schedule';
import retry from 'promise-retry';
import { InternalDateEvent, NanceConfig, SQLSpaceConfig } from '@nance/nance-sdk';
import { EVENTS, ONE_HOUR_SECONDS, TASKS } from '../constants';
import * as tasks from '../tasks';
import { addDaysToDate, addSecondsToDate } from '../utils';
import { getNextEvents } from '../calendar/events';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

const isNotScheduled = (jobName: string) => {
  return !schedule.scheduledJobs[jobName];
};

const scheduleJob = (jobName: string, date: Date, func: () => void) => {
  const now = new Date();
  if (isNotScheduled(jobName) && date > now) {
    schedule.scheduleJob(jobName, date, () => {
      try {
        func();
      } catch (e) {
        console.error(e);
      }
    });
  }
};

export const scheduleCalendarTasks = async (space: string, config: NanceConfig, events: InternalDateEvent[]) => {
  events.forEach(async (event) => {
    if (event.title === EVENTS.TEMPERATURE_CHECK) {
      // Temperature Check start alert
      const sendTemperatureCheckStartDate = addSecondsToDate(event.start, -ONE_HOUR_SECONDS);
      scheduleJob(`${space}:${TASKS.temperatureCheckStartAlert}`, sendTemperatureCheckStartDate, () => {
        tasks.sendStartOrEndAlert(space, config, event.start, EVENTS.TEMPERATURE_CHECK, TASKS.temperatureCheckStartAlert, 'start');
      });
      // Delete Temperature Check start alert
      scheduleJob(`${space}:${TASKS.deleteTemperatureCheckStartAlert}`, event.start, () => {
        tasks.deleteStartOrEndAlert(space, config, TASKS.temperatureCheckStartAlert);
      });
      // Send Temperature Check rollup
      scheduleJob(`${space}:${TASKS.temperatureCheckRollup}`, event.start, () => {
        tasks.temperatureCheckRollup(space, config, event.end);
      });
      // Send Temperature Check end alert
      const sendTemperatureCheckEndDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      scheduleJob(`${space}:${TASKS.temperatureCheckEndAlert}`, sendTemperatureCheckEndDate, async () => {
        const shouldSendAlert = await tasks.shouldSendAlert(space, config);
        if (!shouldSendAlert) return;
        tasks.sendStartOrEndAlert(space, config, event.end, EVENTS.TEMPERATURE_CHECK, TASKS.temperatureCheckEndAlert, 'end');
      });
      // Delete Temperature Check end alert
      scheduleJob(`${space}:${TASKS.deleteTemperatureCheckEndAlert}`, event.end, () => {
        tasks.deleteStartOrEndAlert(space, config, TASKS.temperatureCheckEndAlert);
      });
      // Temperature Check close
      scheduleJob(`${space}:${TASKS.temperatureCheckClose}`, event.end, () => {
        tasks.temperatureCheckClose(space, config);
      });
    }
    if (event.title === EVENTS.SNAPSHOT_VOTE) {
      // Vote setup
      const voteSetupDate = addSecondsToDate(event.start, 60);
      scheduleJob(`${space}:${TASKS.voteSetup}`, voteSetupDate, () => {
        // TODO
        // see how Snapshot uploads fail and do a retry
        tasks.voteSetup(space, config, event.end).then((proposals) => {
          // Send Vote rollup
          if (proposals) {
            tasks.voteRollup(space, config, event.end, proposals);
          }
        });
      });
      // Send 24hr vote ending alert
      const sendVoteOneDayEndDate = addDaysToDate(event.end, -1);
      scheduleJob(`${space}:${TASKS.voteOneDayEndAlert}`, sendVoteOneDayEndDate, async () => {
        const shouldSendAlert = await tasks.shouldSendAlert(space, config);
        if (!shouldSendAlert) return;
        tasks.sendStartOrEndAlert(space, config, event.end, EVENTS.SNAPSHOT_VOTE, TASKS.voteOneDayEndAlert, 'end');
      });
      // Send Vote quorum alert
      const sendVoteQuorumAlertDate = addSecondsToDate(event.end, -4 * ONE_HOUR_SECONDS);
      scheduleJob(`${space}:${TASKS.voteQuorumAlert}`, sendVoteQuorumAlertDate, () => {
        tasks.voteQuorumAlert(space, config, event.end);
      });
      // Send Vote end alert
      const sendVoteEndDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      scheduleJob(`${space}:${TASKS.voteEndAlert}`, sendVoteEndDate, async () => {
        const shouldSendAlert = await tasks.shouldSendAlert(space, config);
        if (!shouldSendAlert) return;
        tasks.sendStartOrEndAlert(space, config, event.end, EVENTS.SNAPSHOT_VOTE, TASKS.voteEndAlert, 'end');
      });
      // Delete Vote end alert
      scheduleJob(`${space}:${TASKS.deleteVoteEndAlert}`, event.end, () => {
        tasks.deleteStartOrEndAlert(space, config, TASKS.voteEndAlert);
      });
      // Vote close
      const voteCloseDate = addSecondsToDate(event.end, 60); // some time for Snapshot results to settle
      scheduleJob(`${space}:${TASKS.voteClose}`, voteCloseDate, async () => {
        const results = await retry(() => { return tasks.voteClose(space, config); }, { retries: 3 });
        if (results) {
          tasks.voteResultsRollup(space, config, results);
        }
      });
    }
    if (event.title === EVENTS.EXECUTION) {
      // Bookkeeping
      const bookkeepingDate = addSecondsToDate(event.start, 5 * 60);
      scheduleJob(`${space}:${TASKS.sendBookkeeping}`, bookkeepingDate, () => {
        tasks.sendBookkeeping(space, config);
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

export const scheduleAllCalendarTasks = async (spaceConfigs: SQLSpaceConfig[]) => {
  spaceConfigs.forEach((spaceConfig) => {
    const { space, cycleStartReference, cycleStageLengths, config } = spaceConfig;
    // schedule all calendar based events
    if (cycleStartReference && cycleStageLengths) {
      const now = new Date();
      const events = getNextEvents(cycleStartReference, cycleStageLengths, now);
      scheduleCalendarTasks(space, config, events);
    }
  });
};
