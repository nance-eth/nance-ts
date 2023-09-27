/* eslint-disable no-restricted-syntax */
import express from 'express';
import { NANCE_AUTO_KEY } from '../keys';
import logger from '../logging';
import { getAllSpaceInfo } from './helpers/getSpaceInfo';
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

const actionsToRun = [
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
  currentDay: number;
  currentEvent?: string;
  actions: string;
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
  const allSpaces = await getAllSpaceInfo('autoEnable = true');
  const resultsPacket = [] as AutoResults[];
  for await (const space of allSpaces) {
    const actionsResults = [];
    const postDailySpaceInfo = await handleDaily(space);
    for await (const action of actionsToRun) {
      try {
        const success = await action(postDailySpaceInfo);
        if (success) actionsResults.push([action.name, `success: ${success}`]);
      } catch (err) {
        actionsResults.push([action.name, err]);
      }
    }
    resultsPacket.push({
      space: space.name,
      currentDay: postDailySpaceInfo.currentDay,
      currentEvent: (postDailySpaceInfo.currentEvent) ? `${postDailySpaceInfo.currentEvent.title} ${postDailySpaceInfo.currentEvent.start.toISOString()} - ${postDailySpaceInfo.currentEvent.end.toISOString()}` : undefined,
      actions: actionsResults.flat().join() // flat join for better viewing on vercel logger, could move the flattening to the frontend
    });
  }
  logger.info('nance-auto');
  logger.info(resultsPacket);
  res.json(resultsPacket);
});

export default router;
