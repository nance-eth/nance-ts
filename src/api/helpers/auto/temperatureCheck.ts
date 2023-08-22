import { discordLogin } from '../discord';
import { SpaceAuto } from '../../models';
import { events } from './constants';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import { DoltHandler } from '../../../dolt/doltHandler';
import { pools } from '../../../dolt/pools';
import {
  shouldSendTemperatureCheckStartAlert,
  shouldDeleteTemperatureCheckStartAlert,
  shouldSendTemperatureCheckRollup,
  shouldSendTemperatureCheckEndAlert,
  shouldSendTemperatureCheckClose,
  shouldDeleteTemperatureCheckEndAlert,
} from './logic';

const doltSys = new DoltSysHandler(pools.nance_sys);

export const handleSendTemperatureCheckStartAlert = async (space: SpaceAuto) => {
  if (shouldSendTemperatureCheckStartAlert(space)) {
    const dialogHandler = await discordLogin(space.config);
    const temperatureCheckStartReminder = await dialogHandler.sendReminder(
      events.TEMPERATURE_CHECK,
      space.currentEvent.end,
      'start'
    );
    await doltSys.updateDialogHandlerMessageId(
      space.name,
      'temperatureCheckStartAlert',
      temperatureCheckStartReminder
    );
    dialogHandler.logout();
  }
};

export const handleDeleteTemperatureCheckStartAlert = async (space: SpaceAuto) => {
  if (shouldDeleteTemperatureCheckStartAlert(space)) {
    const dialogHandler = await discordLogin(space.config);
    await dialogHandler.deleteMessage(space.dialog.temperatureCheckStartAlert);
    await doltSys.updateDialogHandlerMessageId(space.name, 'temperatureCheckStartAlert', '');
    dialogHandler.logout();
  }
};

export const handleSendTemperatureCheckRollup = async (space: SpaceAuto) => {
  if (shouldSendTemperatureCheckRollup(space)) {
    const dialogHandler = await discordLogin(space.config);
    const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
    const proposals = await dolt.getDiscussionProposals();
    const temperatureCheckRollup = await dialogHandler.sendTemperatureCheckRollup(
      proposals,
      space.currentEvent.end,
    );
    // TODO: update status of proposals to temperatureCheck
    await doltSys.updateDialogHandlerMessageId(space.name, 'temperatureCheckRollup', temperatureCheckRollup);
    dialogHandler.logout();
  }
};

export const handleSendTemperatureCheckEndAlert = async (space: SpaceAuto) => {
  if (shouldSendTemperatureCheckEndAlert(space)) {
    const dialogHandler = await discordLogin(space.config);
    const temperatureCheckEndReminder = await dialogHandler.sendReminder(
      events.TEMPERATURE_CHECK,
      space.currentEvent.end,
      'end'
    );
    await doltSys.updateDialogHandlerMessageId(
      space.name,
      'temperatureCheckEndAlert',
      temperatureCheckEndReminder
    );
    dialogHandler.logout();
  }
};

export const handleTemperatureCheckClose = async (space: SpaceAuto) => {
  if (shouldSendTemperatureCheckClose(space)) {
    // TODO: run nance close temperatureCheck
  }
};

export const handleDeleteTemperatureCheckEndAlert = async (space: SpaceAuto) => {
  if (shouldDeleteTemperatureCheckEndAlert(space)) {
    const dialogHandler = await discordLogin(space.config);
    await dialogHandler.deleteMessage(space.dialog.temperatureCheckEndAlert);
    await doltSys.updateDialogHandlerMessageId(space.name, 'temperatureCheckEndAlert', '');
    dialogHandler.logout();
  }
};
