import schedule from 'node-schedule';
import retry from 'promise-retry';
import { DateEvent, NanceConfig } from '../types';
import { EVENTS, ONE_HOUR_SECONDS, TASKS } from '../constants';
import * as tasks from '../tasks/_tasks';
import { addSecondsToDate } from '../utils';

export const scheduleCalendarTasks = async (config: NanceConfig, events: DateEvent[]) => {
  const space = config.name;
  events.forEach(async (event) => {
    if (event.title === EVENTS.TEMPERATURE_CHECK) {
      // Temperature Check start alert
      const sendTemperatureCheckStartDate = addSecondsToDate(event.start, -ONE_HOUR_SECONDS);
      schedule.scheduleJob(`${space}:${TASKS.temperatureCheckStartAlert}`, sendTemperatureCheckStartDate, () => {
        tasks.sendStartOrEndAlert(config, event.start, EVENTS.TEMPERATURE_CHECK, TASKS.temperatureCheckStartAlert, 'start');
      });
      // Delete Temperature Check start alert
      schedule.scheduleJob(`${space}:${TASKS.deleteTemperatureCheckStartAlert}`, event.start, () => {
        tasks.deleteStartOrEndAlert(config, TASKS.temperatureCheckStartAlert);
      });
      // Send Temperature Check rollup
      schedule.scheduleJob(`${space}:${TASKS.temperatureCheckRollup}`, event.start, () => {
        tasks.temperatureCheckRollup(config, event.end);
      });
      // Send Temperature Check end alert
      const sendTemperatureCheckEndDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      schedule.scheduleJob(`${space}:${TASKS.temperatureCheckEndAlert}`, sendTemperatureCheckEndDate, () => {
        tasks.sendStartOrEndAlert(config, event.end, EVENTS.TEMPERATURE_CHECK, TASKS.temperatureCheckEndAlert, 'end');
      });
      // Delete Temperature Check end alert
      schedule.scheduleJob(`${space}:${TASKS.deleteTemperatureCheckEndAlert}`, event.end, () => {
        tasks.deleteStartOrEndAlert(config, TASKS.temperatureCheckEndAlert);
      });
      // Temperature Check close
      schedule.scheduleJob(`${space}:${TASKS.temperatureCheckClose}`, event.end, () => {
        tasks.temperatureCheckClose(config);
      });
    }
    if (event.title === EVENTS.SNAPSHOT_VOTE) {
      // Vote setup
      const voteSetupDate = addSecondsToDate(event.start, 60);
      schedule.scheduleJob(`${space}:${TASKS.voteSetup}`, voteSetupDate, () => {
        // TODO
        // see how Snapshot uploads fail and do a retry
        tasks.voteSetup(config, event.end);
      });
      // Send Vote rollup
      schedule.scheduleJob(`${space}:${TASKS.voteRollup}`, event.start, () => {
        tasks.voteRollup(config, event.end);
      });
      // Send Vote quorum alert
      const sendVoteQuorumAlertDate = addSecondsToDate(event.end, -4 * ONE_HOUR_SECONDS);
      schedule.scheduleJob(`${space}:${TASKS.voteQuorumAlert}`, sendVoteQuorumAlertDate, () => {
        tasks.voteQuorumAlert(config, event.end);
      });
      // Send Vote end alert
      const sendVoteEndDate = addSecondsToDate(event.end, -ONE_HOUR_SECONDS);
      schedule.scheduleJob(`${space}:${TASKS.voteEndAlert}`, sendVoteEndDate, () => {
        tasks.sendStartOrEndAlert(config, event.end, EVENTS.SNAPSHOT_VOTE, TASKS.voteEndAlert, 'end');
      });
      // Delete Vote end alert
      schedule.scheduleJob(`${space}:${TASKS.voteEndAlert}`, event.end, () => {
        tasks.deleteStartOrEndAlert(config, TASKS.voteEndAlert);
      });
      // Vote close
      const voteCloseDate = addSecondsToDate(event.end, 60); // some time for Snapshot results to settle
      schedule.scheduleJob(`${space}:${TASKS.voteClose}`, voteCloseDate, async () => {
        const results = await retry(() => { return tasks.voteClose(config); }, { retries: 3 });
        if (results) {
          tasks.voteResultsRollup(config, results);
        }
      });
    }
    if (event.title === EVENTS.DELAY) {
      // Increment Governance Cycle 5 seconds before Delay ends
      const incrementGovernanceCycleDate = addSecondsToDate(event.end, -5);
      schedule.scheduleJob(`${space}:${TASKS.incrementGovernanceCycle}`, incrementGovernanceCycleDate, () => {
        tasks.incrementGovernanceCycle(space);
      });
    }
  });
};
