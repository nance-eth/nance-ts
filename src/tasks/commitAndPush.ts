import { getSpaceConfig, getSpaceInfo } from "../api/helpers/getSpace";
import { DoltHandler } from "../dolt/doltHandler";
import { pools } from '../dolt/pools';
import { NanceConfig } from "../types";

export const commitAndPush = async (space: string, config: NanceConfig) => {
  try {
    const spaceConfig = await getSpaceConfig(space);
    const { currentCycle, currentEvent, currentDay } = await getSpaceInfo(spaceConfig);
    const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
    await dolt.checkAndPush(undefined, `GC#${currentCycle}:${currentEvent.title}:Day${currentDay}`);
  } catch (e) {
    console.error(e);
  }
};
