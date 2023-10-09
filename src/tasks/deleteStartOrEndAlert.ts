import { NanceConfig } from '../types';
import { discordLogin } from '../api/helpers/discord';
import { doltSys } from '../dolt/doltSys';
import { DialogHandlerMessageIds } from '../dolt/schema';

export const deleteStartOrEndAlert = async (
  config: NanceConfig,
  dialogHandlerMessageType: string,
) => {
  const messageId = await doltSys.getDialogHandlerMessageIds(config.name);
  const dialogHandler = await discordLogin(config);
  await dialogHandler.deleteMessage(messageId[dialogHandlerMessageType as keyof DialogHandlerMessageIds]);
  await doltSys.updateDialogHandlerMessageId(config.name, dialogHandlerMessageType, '');
  dialogHandler.logout();
};
