import express from 'express';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { DBConfig } from '../dolt/types';
import { dotPin } from '../storage/storageHandler';
import { checkSignature } from './helpers/signature';
import { CreateSpaceRequest } from './models';

const router = express.Router();

const dbOptions: DBConfig = { database: 'nance_sys', host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD };
const dolt = new DoltSysHandler(dbOptions);

router.get('/', (req, res) => {
  res.send('nance-ish control panel');
});

router.post('/config', async (req, res) => {
  const { space, config, signature } = req.body as CreateSpaceRequest;
  const { valid } = checkSignature(signature, space, 'config', config);
  const packedConfig = JSON.stringify({ signature, config });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); return; }
  const cid = await dotPin(packedConfig);
  dolt.setSpaceCID(space, cid);
  res.json({ success: true, data: cid });
});

export default router;
