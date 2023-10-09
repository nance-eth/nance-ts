import { NanceConfig } from '../types';
import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import { EVENTS } from '../constants';
import { DialogHandlerMessageIds } from '../dolt/schema';

export const sendStartOrEndAlert = async (
  config: NanceConfig,
  startOrEndDate: Date,
  event: keyof typeof EVENTS,
  dialogHandlerMessageType: keyof DialogHandlerMessageIds,
  startOrEnd: 'start' | 'end'
) => {
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
  return true;
};
