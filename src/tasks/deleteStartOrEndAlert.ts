import { NanceConfig } from '../types';
import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import { DialogHandlerMessageIds } from '../dolt/schema';

export const deleteStartOrEndAlert = async (
  config: NanceConfig,
  dialogHandlerMessageType: string,
) => {
  try {
    const messageId = await doltSys.getDialogHandlerMessageIds(config.name);
    if (messageId[dialogHandlerMessageType as keyof DialogHandlerMessageIds] === '') return;
    const dialogHandler = await discordLogin(config);
    await dialogHandler.deleteMessage(messageId[dialogHandlerMessageType as keyof DialogHandlerMessageIds]);
    await doltSys.updateDialogHandlerMessageId(config.name, dialogHandlerMessageType, '');
    dialogHandler.logout();
  } catch (e) {
    console.error(`error deleting ${dialogHandlerMessageType} for ${config.name}`);
    console.error(e);
  }
};
