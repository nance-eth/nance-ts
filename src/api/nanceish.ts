import express from 'express';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { createDolthubDB, headToUrl } from '../dolt/doltAPI';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { dbOptions } from '../dolt/dbConfig';
import { dotPin } from '../storage/storageHandler';
import { checkSignature } from './helpers/signature';
import { ConfigSpaceRequest } from './models';
import { mergeTemplateConfig, mergeConfig, fetchTemplateCalendar } from '../utils';
import logger from '../logging';
import { pools } from '../dolt/pools';

const router = express.Router();

router.get('/', (_, res) => {
  res.send('nance-ish control panel');
});

router.get('/config/:space', async (req, res) => {
  const { space } = req.params;
  const dolt = new DoltSysHandler(pools.nance_sys);
  dolt.getSpaceConfig(space).then((doltConfig) => {
    if (doltConfig) { res.json({ success: true, data: doltConfig }); return; }
    res.json({ success: false, error: `config ${space} not found!` });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/all', async (_, res) => {
  const doltSys = new DoltSysHandler(pools.nance_sys);
  doltSys.getAllSpaceNames().then(async (data) => {
    const infos = await Promise.all(data.map(async (entry) => {
      const dolt = new DoltHandler(pools[entry.space], entry.config.propertyKeys);
      const calendar = new CalendarHandler(entry.calendar);
      const currentCycle = await dolt.getCurrentGovernanceCycle();
      const currentEvent = calendar.getCurrentEvent();
      const head = await dolt.getHead();
      return {
        name: entry.space,
        currentCycle,
        currentEvent,
        snapshotSpace: entry.config.snapshot.space,
        juiceboxProjectId: entry.config.juicebox.projectId,
        dolthubLink: headToUrl(entry.config.dolt.owner, entry.config.dolt.repo, head),
      };
    }));
    res.json({ success: true, data: infos });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.post('/config', async (req, res) => {
  const { config, signature, calendar, owners } = req.body as ConfigSpaceRequest;
  const space = config.name;
  // signature must be valid
  const { valid } = checkSignature(signature, 'ish', 'config', { ...config, calendar, owners });
  if (!valid) { res.json({ success: false, error: '[NANCE ERROR]: bad signature' }); return; }

  // check if space exists and confiugurer is spaceOwner
  const dolt = new DoltSysHandler(pools.nance_sys);
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
  const configIn = (spaceConfig) ? mergeConfig(spaceConfig.config, config) : mergeTemplateConfig(config);
  const packedConfig = JSON.stringify({ signature, config: configIn, calendar: calendarIn });
  const cid = await dotPin(packedConfig);
  const ownersIn = [...(owners ?? []), signature.address];
  dolt.setSpaceConfig(space, cid, ownersIn, configIn, calendarIn).then(() => {
    res.json({ success: true, data: { space, spaceOwners: ownersIn } });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

export default router;
