/* eslint-disable no-restricted-syntax */
import express from 'express';
import { NANCE_AUTO_KEY } from '../keys';
import getAllSpaces from './helpers/getAllSpaces';
import {
  handleSendTemperatureCheckStartAlert,
  handleDeleteTemperatureCheckStartAlert,
  handleSendTemperatureCheckRollup,
  handleSendTemperatureCheckEndAlert,
  handleTemperatureCheckClose,
  handleDeleteTemperatureCheckEndAlert
} from './helpers/auto/temperatureCheck';
import {
  handleVoteSetup,
  handleSendVoteRollup,
  handleSendVoteEndAlert,
  handleVoteClose,
  handleDeleteVoteEndAlert
} from './helpers/auto/vote';
import { handleDaily } from './helpers/auto/daily';

const enabledFor = ['waterbox', 'nance', 'thirstythirsty'];
const actionsToRun = [
  handleDaily,
  handleSendTemperatureCheckStartAlert,
  handleDeleteTemperatureCheckStartAlert,
  handleSendTemperatureCheckRollup,
  handleSendTemperatureCheckEndAlert,
  handleTemperatureCheckClose,
  handleDeleteTemperatureCheckEndAlert,
  handleVoteSetup,
  handleSendVoteRollup,
  handleSendVoteEndAlert,
  handleVoteClose,
  handleDeleteVoteEndAlert
];

const router = express.Router();

type AutoResults = {
  space: string;
  actions: {
    name: string;
    success: any;
  }[];
};

function handleAuth(auth: string | undefined) {
  const key = auth?.split('Bearer ')[1];
  if (key === NANCE_AUTO_KEY) return true;
  return false;
}

router.get('/', (_, res) => {
  res.send('nance-auto');
});

router.get('/events', async (req, res) => {
  if (!handleAuth(req.headers.authorization)) {
    res.status(401).send('Unauthorized');
    return;
  }
  const allSpaces = (await getAllSpaces()).filter((space) => { return enabledFor.includes(space.name); });
  const resultsPacket = [] as AutoResults[];
  for await (const space of allSpaces) {
    const actionsResults = [];
    for await (const action of actionsToRun) {
      try {
        const success = await action(space);
        if (success) actionsResults.push({ name: action.name, success });
      } catch (err) {
        actionsResults.push({ name: action.name, success: err });
      }
    }
    resultsPacket.push({
      space: space.name,
      actions: actionsResults
    });
  }
  res.json(resultsPacket);
});

export default router;
