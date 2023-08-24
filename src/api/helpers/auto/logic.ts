import { SpaceAuto } from '../../models';
import { addDaysToDate, addSecondsToDate } from '../../../utils';
import { FIVE_MINUTES_SECONDS, ONE_HOUR_SECONDS, events } from './constants';

export const shouldSendTemperatureCheckStartAlert = (space: SpaceAuto) => {
  const now = new Date();
  return (
    (space.currentEvent.title === events.DELAY
    && addSecondsToDate(space.currentEvent.end, -ONE_HOUR_SECONDS) <= now
    && space.dialog.temperatureCheckStartAlert === '')
  );
};

export const shouldDeleteTemperatureCheckStartAlert = (space: SpaceAuto) => {
  const now = new Date();
  return (
    (space.currentEvent.title === events.TEMPERATURE_CHECK
    && addSecondsToDate(space.currentEvent.start, FIVE_MINUTES_SECONDS) <= now
    && space.dialog.temperatureCheckStartAlert !== '')
  );
};

export const shouldSendTemperatureCheckRollup = (space: SpaceAuto) => {
  const now = new Date();
  return (
    (space.currentEvent.title === events.TEMPERATURE_CHECK
    && space.currentEvent.start <= now
    && space.dialog.temperatureCheckRollup === '')
  );
};

export const shouldSendTemperatureCheckEndAlert = (space: SpaceAuto) => {
  const now = new Date();
  return (
    (space.currentEvent.title === events.TEMPERATURE_CHECK
    && addSecondsToDate(space.currentEvent.end, -ONE_HOUR_SECONDS) <= now
    && space.dialog.temperatureCheckEndAlert === '')
  );
};

export const shouldSendTemperatureCheckClose = (space: SpaceAuto) => {
  const now = new Date();
  return (
    (space.currentEvent.title === events.TEMPERATURE_CHECK
    && space.currentEvent.end <= now)
  );
};

export const shouldDeleteTemperatureCheckEndAlert = (space: SpaceAuto) => {
  const now = new Date();
  return (
    (space.currentEvent.title === events.TEMPERATURE_CHECK
    && addSecondsToDate(space.currentEvent.end, FIVE_MINUTES_SECONDS) <= now
    && space.dialog.temperatureCheckEndAlert !== '')
  );
};

export const shouldIncrementDay = (space: SpaceAuto) => {
  const now = new Date();
  return (
    addDaysToDate(space.cycleDayLastUpdated, 1) <= now
  );
};