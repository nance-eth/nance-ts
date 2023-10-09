import { doltSys } from '../dolt/doltSys';
import logger from '../logging';

export const incrementGovernanceCycle = async (space: string) => {
  try {
    await doltSys.incrementGovernanceCycle(space);
  } catch (e) {
    logger.error(`error incrementing governance cycle for ${space}`);
    logger.error(e);
  }
};
