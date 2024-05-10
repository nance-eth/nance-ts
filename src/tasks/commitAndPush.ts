import { getSpaceConfig, getSpaceInfo } from "../api/helpers/getSpace";
import { DoltHandler } from "../dolt/doltHandler";
import { pools } from '../dolt/pools';

export const commitAndPush = async (space: string) => {
  try {
    const spaceConfig = await getSpaceConfig(space);
    const { currentCycle, currentEvent, currentCycleDay } = await getSpaceInfo(spaceConfig);
    const dolt = new DoltHandler(pools[space], spaceConfig.config.proposalIdPrefix);
    await dolt.checkAndPush(undefined, `GC#${currentCycle}:${currentEvent.title}:Day${currentCycleDay}`);
  } catch (e) {
    console.error(e);
  }
};
