import { NanceConfig } from '../types';
import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import { DialogHandlerMessageIds } from '../dolt/schema';

export const deleteStartOrEndAlert = async (
  space: string,
  config: NanceConfig,
  dialogHandlerMessageType: string,
) => {
  try {
    const messageId = await doltSys.getDialogHandlerMessageIds(space);
    if (messageId[dialogHandlerMessageType as keyof DialogHandlerMessageIds] === '') return;
    const dialogHandler = await discordLogin(config);
    await dialogHandler.deleteMessage(messageId[dialogHandlerMessageType as keyof DialogHandlerMessageIds]);
    await doltSys.updateDialogHandlerMessageId(space, dialogHandlerMessageType, '');
    dialogHandler.logout();
  } catch (e) {
    console.error(`error deleting ${dialogHandlerMessageType} for ${space}`);
    console.error(e);
  }
};
