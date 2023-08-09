import express from 'express';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { createDolthubDB, headToUrl } from '../dolt/doltAPI';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { dotPin } from '../storage/storageHandler';
import { ConfigSpaceRequest } from './models';
import { mergeTemplateConfig, mergeConfig, fetchTemplateCalendar, omitKey } from '../utils';
import logger from '../logging';
import { pools } from '../dolt/pools';
import { dbOptions } from '../dolt/dbConfig';
import { DoltSQL } from '../dolt/doltSQL';
import { addressFromJWT } from './helpers/auth';
import { createCalendarFromForm } from './helpers/calendar';
import { NanceConfig } from '../types';

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
  const { config, owners, dryrun } = req.body as ConfigSpaceRequest;
  const space = config.name;
  // get address from jwt (SIWE)
  const jwt = req.headers.authorization?.split('Bearer ')[1];
  const address = (jwt && jwt !== 'null') ? await addressFromJWT(jwt) : null;
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: no SIWE address found' }); return; }

  // check if space exists and configurer is spaceOwner
  const dolt = new DoltSysHandler(pools.nance_sys);
  const spaceConfig = await dolt.getSpaceConfig(space);
  if (spaceConfig && !spaceConfig.spaceOwners.includes(address)) {
    res.json({ success: false, error: '[NANCE ERROR] configurer not spaceOwner!' });
    return;
  }

  // create space if it doesn't exist
  logger.info(`[CREATE SPACE]: ${JSON.stringify(config)}`);
  if (!spaceConfig) {
    if (!dryrun) {
      dolt.createSpaceDB(space).then(async () => {
        try { await dolt.createSchema(space); } catch (e) { logger.error(e); }
        try { await createDolthubDB(space); } catch (e) { logger.error(e); }
        try { await dolt.localDolt.addRemote(`https://doltremoteapi.dolthub.com/nance/${space}`); } catch (e) { logger.error(e); }
        pools[space] = new DoltSQL(dbOptions(space));
        try { await dolt.localDolt.push(true); } catch (e) { logger.error(e); }
      }).catch((e) => {
        logger.error('[CREATE SPACE]:');
        logger.error(e);
      });
    }
  }

  // config the space
  const calendar = (config.governanceCycleForm) ? createCalendarFromForm(config.governanceCycleForm) : fetchTemplateCalendar();
  const cleanedConfig = omitKey(config, 'governanceCycleForm') as NanceConfig;
  const configIn = (spaceConfig) ? mergeConfig(spaceConfig.config, cleanedConfig) : mergeTemplateConfig(config);
  const packedConfig = JSON.stringify({ address, config: configIn, calendar });
  const cid = await dotPin(packedConfig);
  const ownersIn = [...(owners ?? []), address];
  dolt.setSpaceConfig(space, cid, ownersIn, configIn, calendar).then(() => {
    res.json({ success: true, data: { space, spaceOwners: ownersIn } });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

export default router;
