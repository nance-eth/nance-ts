import schedule from 'node-schedule';
import { getSpaceConfig } from '../api/helpers/getSpace';
import { discordLogin } from '../api/helpers/discord';
import { juiceboxTime } from '../api/helpers/juicebox';
import logger from '../logging';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

const juiceboxTimeBasedDaysRemaining = [20, 15, 10, 5, 4, 3, 2, 1];

export async function sendDailyJBAlert(space: string) {
  logger.info('===================================================================');
  logger.info(`=============== sending dailyJBAlert for ${space} ================`);
  try {
    // refetch spaceConfig to get latest cycle information
    const { config } = await getSpaceConfig(space);
    const { currentGovernanceCycle, cycleCurrentDay, daysRemainingToSubmitReconfig, end, delay } = await juiceboxTime(config.juicebox.projectId);
    logger.info(`currentGovernanceCycleDay: ${cycleCurrentDay}`);
    logger.info(`daysRemaining: ${JSON.stringify(daysRemainingToSubmitReconfig)}`);
    if (juiceboxTimeBasedDaysRemaining.includes(daysRemainingToSubmitReconfig)) {
      const endDate = new Date(end);
      const dialogHandler = await discordLogin(config);
      await dialogHandler.sendDailyReminder(cycleCurrentDay, currentGovernanceCycle, '', endDate, delay);
      logger.info(`dailyJBAlert sent for ${space}`);
      logger.info(`next innvocation at ${schedule.scheduledJobs[`${space}:dailyJBAlert`].nextInvocation().toISOString()}`);
    } else {
      logger.info(`no dailyJBAlert sent for ${space}, not included in alert days: ${juiceboxTimeBasedDaysRemaining}`);
    }
  } catch (e) {
    logger.error(`error sending dailyJucieboxBasedAlert for ${space}`);
    logger.error(e);
  }
  logger.info('===================================================================');
}
