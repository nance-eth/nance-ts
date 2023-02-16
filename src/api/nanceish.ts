import express from 'express';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { dotPin } from '../storage/storageHandler';
import { checkSignature } from './helpers/signature';
import { ConfigSpaceRequest } from './models';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('nance-ish control panel');
});

router.post('/create', async (req, res) => {
  const { space } = req.body;
  const dolt = new DoltSysHandler();
  dolt.createSpaceDB(space).then((data) => {
    dolt.createSchema(space).then(() => {
      res.json({ success: true, data });
    });
  }).catch((e) => {
    res.json({ success: false, error: e.sqlMessage });
  });
});

router.post('/config', async (req, res) => {
  const { space, config, signature, calendar } = req.body as ConfigSpaceRequest;
  const { valid } = checkSignature(signature, space, 'config', { ...config, calendar });
  const calendarCID = (calendar) ? await dotPin(calendar) : undefined;
  const packedConfig = JSON.stringify({ signature, config, calendar: calendarCID });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); return; }
  const cid = await dotPin(packedConfig);
  const dolt = new DoltSysHandler();
  dolt.setSpaceCID(space, cid).then(() => {
    res.json({ success: true, data: cid });
  });
});

export default router;
