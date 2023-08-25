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
import { handleDaily } from './helpers/auto/daily';

const enabledFor = ['nance', 'waterbox'];

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
    handleDaily(space);

    // Temperature Check
    handleSendTemperatureCheckStartAlert(space);
    handleSendTemperatureCheckRollup(space);
    handleDeleteTemperatureCheckStartAlert(space);
    handleSendTemperatureCheckEndAlert(space);
    handleTemperatureCheckClose(space);
    handleDeleteTemperatureCheckEndAlert(space);

    // Vote
    // TODO
    // handleVoteSetup(space);
    // handleSendVoteRollup(space);
    // handleSendVoteEndAlert(space);
    // handleVoteClose(space);
    // handleDeleteVoteEndAlert(space);
  })).then(() => {
    res.json({ success: true, data: '' }); // add list of updates here, may be useful
  }).catch((e) => {
    console.error(e);
    res.status(500).send('Internal Server Error');
  });
});

export default router;
