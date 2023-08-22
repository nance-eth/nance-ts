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
  const allSpaces = await getAllSpaces();
  Promise.allSettled(allSpaces.map(async (space) => {
    // Temperature Check
    handleSendTemperatureCheckStartAlert(space);
    handleDeleteTemperatureCheckStartAlert(space);
    handleSendTemperatureCheckRollup(space);
    handleSendTemperatureCheckEndAlert(space);
    handleTemperatureCheckClose(space);
    handleDeleteTemperatureCheckEndAlert(space);
    // Vote
    // TODO
    //
  })).then(() => {
    res.send('ok');
  }).catch((e) => {
    console.error(e);
    res.status(500).send('Internal Server Error');
  });
});

export default router;
