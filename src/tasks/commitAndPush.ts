import { getSpaceConfig, getSpaceInfo } from "../api/helpers/getSpace";
import { getDb } from "../dolt/pools";

export const commitAndPush = async (space: string) => {
  try {
    const spaceConfig = await getSpaceConfig(space);
    const { currentCycle, currentEvent, currentCycleDay } = getSpaceInfo(spaceConfig);
    const dolt = getDb(space);
    await dolt.checkAndPush(undefined, `GC#${currentCycle}:${currentEvent.title}:Day${currentCycleDay}`);
  } catch (e: any) {
    if (e.Error === "nothing to commit") console.error(`nothing to commit for ${space}`);
    else console.error(e);
  }
};
