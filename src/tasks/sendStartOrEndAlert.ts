import { NanceConfig } from '@nance/nance-sdk';
import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import logger from '../logging';

export const sendStartOrEndAlert = async (
  space: string,
  config: NanceConfig,
  startOrEndDate: Date,
  event: string,
  dialogHandlerMessageType: string,
  startOrEnd: 'start' | 'end'
) => {
  try {
    const dialogHandler = await discordLogin(config);
    const startOrEndReminderMessageId = await dialogHandler.sendReminder(
      event,
      startOrEndDate,
      startOrEnd
    );
    await doltSys.updateDialogHandlerMessageId(
      space,
      dialogHandlerMessageType,
      startOrEndReminderMessageId
    );
    dialogHandler.logout();
  } catch (e) {
    logger.error(`error sending ${startOrEnd} alert for ${space}`);
    logger.error(e);
  }
};
