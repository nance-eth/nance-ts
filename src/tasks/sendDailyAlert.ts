import { getSpaceConfig } from '../api/helpers/getSpace';
import { getCurrentEvent, getCurrentGovernanceCycleDay } from '../calendar/events';
import { discordLogin } from '../api/helpers/discord';
import logger from '../logging';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

export async function sendDailyAlert(space: string) {
  logger.info('===================================================================');
  logger.info(`================= sending dailyAlert for ${space} =================`);
  const now = new Date();
  try {
    // refetch spaceConfig to get latest cycle information
    const spaceConfig = await getSpaceConfig(space);
    if (!spaceConfig || !spaceConfig.cycleStartReference || !spaceConfig.cycleStageLengths) return false;
    const { config, currentGovernanceCycle } = spaceConfig;
    const currentEvent = getCurrentEvent(spaceConfig.cycleStartReference, spaceConfig.cycleStageLengths, now);
    const currentGovernanceCycleDay = getCurrentGovernanceCycleDay(currentEvent, spaceConfig.cycleStageLengths, now);
    logger.info(`currentGovernanceCycleDay: ${currentGovernanceCycleDay}`);
    logger.info(`currentEvent: ${JSON.stringify(currentEvent)}`);
    const dialogHandler = await discordLogin(config);
    await dialogHandler.sendDailyReminder(currentGovernanceCycleDay, currentGovernanceCycle, currentEvent.title, currentEvent.end);
    logger.info('===================================================================');
    return true;
  } catch (e) {
    logger.error(`error sending dailyAlert for ${space}`);
    logger.error(e);
    logger.info('===================================================================');
    return Promise.reject(e);
  }
}
