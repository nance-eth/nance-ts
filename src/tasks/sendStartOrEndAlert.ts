import { NanceConfig } from '../types';
import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import logger from '../logging';

export const sendStartOrEndAlert = async (
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
      config.name,
      dialogHandlerMessageType,
      startOrEndReminderMessageId
    );
    dialogHandler.logout();
  } catch (e) {
    logger.error(`error sending ${startOrEnd} alert for ${config.name}`);
    logger.error(e);
  }
};
