import { SpaceInfo } from '../../models';
import { addDaysToDate, addSecondsToDate } from '../../../utils';
import { FIVE_MINUTES_SECONDS, ONE_HOUR_SECONDS, EVENTS } from './constants';

export const shouldSendTemperatureCheckStartAlert = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.DELAY
    && addSecondsToDate(space.currentEvent.end, -ONE_HOUR_SECONDS) <= now
    && space.dialog.temperatureCheckStartAlert === '')
  );
};

export const shouldDeleteTemperatureCheckStartAlert = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.TEMPERATURE_CHECK
    && addSecondsToDate(space.currentEvent.start, FIVE_MINUTES_SECONDS) <= now
    && space.dialog.temperatureCheckStartAlert !== '')
  );
};

export const shouldSendTemperatureCheckRollup = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.TEMPERATURE_CHECK
    && space.currentEvent.start <= now
    && space.dialog.temperatureCheckRollup === '')
  );
};

export const shouldSendTemperatureCheckEndAlert = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.TEMPERATURE_CHECK
    && addSecondsToDate(space.currentEvent.end, -ONE_HOUR_SECONDS) <= now
    && space.dialog.temperatureCheckEndAlert === '')
  );
};

export const shouldSendTemperatureCheckClose = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.SNAPSHOT_VOTE
    && space.currentEvent.start <= now)
  );
};

export const shouldDeleteTemperatureCheckEndAlert = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.SNAPSHOT_VOTE
    && addSecondsToDate(space.currentEvent.end, FIVE_MINUTES_SECONDS) >= now
    && space.dialog.temperatureCheckEndAlert !== '')
  );
};

export const shouldIncrementDay = (space: SpaceInfo) => {
  const now = new Date();
  return (
    addDaysToDate(space.cycleDayLastUpdated, 1) <= now
  );
};

export const shouldSendVoteRollup = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.SNAPSHOT_VOTE
    && space.currentEvent.start <= now
    && space.dialog.votingRollup === '')
  );
};

export const shouldSendVoteEndAlert = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.SNAPSHOT_VOTE
    && addSecondsToDate(space.currentEvent.end, -ONE_HOUR_SECONDS) <= now
    && space.dialog.votingEndAlert === '')
  );
};

export const shouldCloseVote = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.EXECUTION
    && space.currentEvent.start <= now)
    && space.dialog.votingResultsRollup === ''
  );
};

export const shouldDeleteVoteEndAlert = (space: SpaceInfo) => {
  const now = new Date();
  return (
    (space.currentEvent?.title === EVENTS.EXECUTION
    && addSecondsToDate(space.currentEvent.start, FIVE_MINUTES_SECONDS) <= now
    && space.dialog.votingEndAlert !== '')
  );
};
