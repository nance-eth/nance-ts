import express from 'express';
import { NANCE_AUTO_KEY } from '../keys';
import getAllSpaces from './helpers/getAllSpaces';

const router = express.Router();

function handleAuth(auth: string | undefined) {
  const key = auth?.split('Bearer')[1];
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
});

export default router;
