import { NanceConfig, DialogHandlerMessageIds } from '@nance/nance-sdk';
import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { TASKS } from '../constants';
import logger from '../logging';

export const temperatureCheckRollup = async (space: string, config: NanceConfig, endDate: Date) => {
  try {
    const dialogHandler = await discordLogin(config);
    const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
    const proposals = await dolt.getDiscussionProposals();
    if (proposals.length === 0) return await Promise.resolve();
    const temperatureCheckRollupMessageId = await dialogHandler.sendTemperatureCheckRollup(
      proposals,
      endDate,
    );
    await dolt.updateStatuses(proposals, "Temperature Check");
    await doltSys.updateDialogHandlerMessageId(
      space,
      TASKS.temperatureCheckRollup as keyof DialogHandlerMessageIds,
      temperatureCheckRollupMessageId
    );
    dialogHandler.logout();
    return await Promise.resolve();
  } catch (e) {
    logger.error(`error rolling up temperatureCheck for ${space}`);
    logger.error(e);
    return Promise.reject(e);
  }
};
