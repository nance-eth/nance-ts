import { NanceConfig, DialogHandlerMessageIds } from "@nance/nance-sdk";
import { discordLogin } from "@/api/helpers/discord";
import { getDb, getSysDb } from "@/dolt/pools";
import { TASKS } from "@/constants";
import logger from "@/logging";
import { getSpaceConfig } from "../api/helpers/getSpace";

export const temperatureCheckRollup = async (space: string, config: NanceConfig, endDate: Date) => {
  try {
    const dialogHandler = await discordLogin(config);
    const dolt = getDb(space);
    const { currentGovernanceCycle } = await getSpaceConfig(space);
    const { proposals } = await dolt.getProposals({ governanceCycle: currentGovernanceCycle, status: ["Discussion"] });
    if (proposals.length === 0) return await Promise.resolve();
    const temperatureCheckRollupMessageId = await dialogHandler.sendTemperatureCheckRollup(
      proposals,
      endDate,
    );
    await dolt.updateStatuses(proposals, "Temperature Check");
    await getSysDb().updateDialogHandlerMessageId(
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
