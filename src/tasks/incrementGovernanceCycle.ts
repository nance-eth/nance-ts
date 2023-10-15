import { doltSys } from '../dolt/doltSys';
import logger from '../logging';
import { TASKS } from '../constants';
import { DialogHandlerMessageIds } from '../dolt/schema';

export const incrementGovernanceCycle = async (space: string) => {
  try {
    await doltSys.incrementGovernanceCycle(space);
    await doltSys.updateDialogHandlerMessageId(space, TASKS.temperatureCheckRollup as keyof DialogHandlerMessageIds, '');
    await doltSys.updateDialogHandlerMessageId(space, TASKS.voteRollup as keyof DialogHandlerMessageIds, '');
    await doltSys.updateDialogHandlerMessageId(space, TASKS.voteQuorumAlert as keyof DialogHandlerMessageIds, '');
    await doltSys.updateDialogHandlerMessageId(space, TASKS.voteResultsRollup as keyof DialogHandlerMessageIds, '');
  } catch (e) {
    logger.error(`error incrementing governance cycle for ${space}`);
    logger.error(e);
  }
};
