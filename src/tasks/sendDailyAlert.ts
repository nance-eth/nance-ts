import schedule from 'node-schedule';
import { getSpaceConfig } from '../api/helpers/getSpace';
import { getCurrentEvent, getCurrentGovernanceCycleDay } from '../calendar/events';
import { discordLogin } from '../api/helpers/discord';
import logger from '../logging';

export async function sendDailyAlert(space: string) {
  logger.info('===================================================================');
  logger.info(`================= sending dailyAlert for ${space} =================`);
  const now = new Date();
  try {
    // refetch spaceConfig to get latest cycle information
    const spaceConfig = await getSpaceConfig(space);
    const { config, currentGovernanceCycle } = spaceConfig;
    const currentEvent = getCurrentEvent(spaceConfig.calendar, spaceConfig.cycleStageLengths, now);
    const currentGovernanceCycleDay = getCurrentGovernanceCycleDay(currentEvent, spaceConfig.cycleStageLengths, now);
    logger.info(`currentGovernanceCycleDay: ${currentGovernanceCycleDay}`);
    logger.info(`currentEvent: ${JSON.stringify(currentEvent)}`);
    const dialogHandler = await discordLogin(config);
    await dialogHandler.sendDailyReminder(currentGovernanceCycleDay, currentGovernanceCycle, currentEvent.title, currentEvent.end);
    logger.info(`dailyAlert sent for ${space}`);
    logger.info(`next innvocation at ${schedule.scheduledJobs[`${space}:dailyAlert`].nextInvocation().toISOString()}`);
  } catch (e) {
    logger.error(`error sending dailyAlert for ${space}`);
    logger.error(e);
  }
  logger.info('===================================================================');
}
