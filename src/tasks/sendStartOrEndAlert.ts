import { GovernanceEvent, NanceConfig } from "@nance/nance-sdk";
import { discordLogin } from "../api/helpers/discord";
import logger from "../logging";
import { getSysDb } from "@/dolt/pools";

export const sendStartOrEndAlert = async (
  space: string,
  config: NanceConfig,
  startOrEndDate: Date,
  event: GovernanceEvent,
  dialogHandlerMessageType: string,
  startOrEnd: "start" | "end"
) => {
  try {
    const dialogHandler = await discordLogin(config);
    const startOrEndReminderMessageId = await dialogHandler.sendReminder(
      event,
      startOrEndDate,
      startOrEnd
    );
    await getSysDb().updateDialogHandlerMessageId(
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
