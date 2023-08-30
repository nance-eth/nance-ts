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

const enabledFor = ['waterbox', 'thirstythirsty'];

const router = express.Router();

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
  Promise.allSettled(allSpaces.map(async (space) => {
    // Daily reminder
    await handleDaily(space);

    // Temperature Check
    // await handleSendTemperatureCheckStartAlert(space);
    // await handleSendTemperatureCheckRollup(space);
    // await handleDeleteTemperatureCheckStartAlert(space);
    // await handleSendTemperatureCheckEndAlert(space);
    // await handleTemperatureCheckClose(space);
    // await handleDeleteTemperatureCheckEndAlert(space);

    // // Vote
    // await handleVoteSetup(space);
    // await handleSendVoteRollup(space);
    // await handleSendVoteEndAlert(space);
    // await handleVoteClose(space);
    // await handleDeleteVoteEndAlert(space);
  })).then(() => {
    res.json({ success: true, data: '' }); // add list of updates here, may be useful
  }).catch((e) => {
    console.error(e);
    res.status(500).send('Internal Server Error');
  });
});

export default router;
