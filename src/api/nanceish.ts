import express from 'express';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { createDolthubDB } from '../dolt/doltAPI';
import { dotPin } from '../storage/storageHandler';
import { checkSignature } from './helpers/signature';
import { ConfigSpaceRequest } from './models';
import { mergeTemplateConfig, fetchTemplateCalendar } from '../utils';
import { nanceAddress } from '../keys';
import logger from '../logging';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('nance-ish control panel');
});

router.post('/config', async (req, res) => {
  const { config, signature, calendar } = req.body as ConfigSpaceRequest;
  const space = config.name;
  // signature must be valid
  const { valid } = checkSignature(signature, 'ish', 'config', { ...config, calendar });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); return; }

  // check if space exists and confiugurer is spaceOwner
  const dolt = new DoltSysHandler();
  const spaceConfig = await dolt.getSpaceConfig(space);
  if (spaceConfig && !spaceConfig.spaceOwners.includes(signature.address)) {
    res.json({ success: false, error: '[NANCE ERROR] configurer not spaceOwner!' });
    return;
  }

  // create space if it doesn't exist
  if (!spaceConfig) {
    dolt.createSpaceDB(space).then(async () => {
      await dolt.createSchema(space);
      await createDolthubDB(space);
      await dolt.localDolt.addRemote(`https://doltremoteapi.dolthub.com/nance/${space}`);
    }).catch((e) => { logger.error(`[CREATE SPACE]: ${e}`); });
  }

  // config the space
  const calendarIn = calendar || fetchTemplateCalendar();
  const configIn = mergeTemplateConfig(config);
  const packedConfig = JSON.stringify({ signature, config: configIn, calendar: calendarIn });
  const cid = await dotPin(packedConfig);
  dolt.setSpaceConfig(space, cid, [signature.address, nanceAddress], configIn, calendarIn).then(() => {
    res.json({ success: true, data: { space, spaceOwner: signature.address } });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

export default router;
