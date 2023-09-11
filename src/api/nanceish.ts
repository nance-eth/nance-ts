import express from 'express';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { createDolthubDB, headToUrl } from '../dolt/doltAPI';
import { DoltHandler } from '../dolt/doltHandler';
import { dotPin } from '../storage/storageHandler';
import { ConfigSpaceRequest } from './models';
import { mergeTemplateConfig, mergeConfig, fetchTemplateCalendar, omitKey, dateAtTime } from '../utils';
import logger from '../logging';
import { pools } from '../dolt/pools';
import { dbOptions } from '../dolt/dbConfig';
import { DoltSQL } from '../dolt/doltSQL';
import { addressFromJWT } from './helpers/auth';
import { FormTime, GovernanceCycleForm, NanceConfig } from '../types';
import getAllSpaces from './helpers/getAllSpaces';

const router = express.Router();

const formToSQLTime = (timeIn?: FormTime) => {
  if (!timeIn) { return '00:00:00'; }
  const hour = -1 * (timeIn.hour + (timeIn.timezoneOffset / 60) + (timeIn.ampm === 'PM' ? 12 : 0) - 24);
  const hourString = hour.toString().padStart(2, '0');
  return `${hourString}:${timeIn.minute}:00`;
};

const formToCycleStageLengths = (form?: GovernanceCycleForm) => {
  if (!form) { return [3, 4, 4, 3]; }
  return [
    Number(form.temperatureCheckLength),
    Number(form.voteLength),
    Number(form.executionLength),
    Number(form.delayLength),
  ];
};

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
  getAllSpaces().then(async (data) => {
    const infos = await Promise.all(data.map(async (space) => {
      const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
      const head = await dolt.getHead();
      return {
        name: space.name,
        currentCycle: space.currentCycle,
        currentEvent: space.currentEvent,
        snapshotSpace: space.config.snapshot.space,
        juiceboxProjectId: space.config.juicebox.projectId,
        dolthubLink: headToUrl(space.config.dolt.owner, space.config.dolt.repo, head),
      };
    }));
    res.json({ success: true, data: infos });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.post('/config', async (req, res) => {
  const { config, dryrun, owners } = req.body as ConfigSpaceRequest;
  const cycleCurrentDay = 1;
  const cycleTriggerTime = formToSQLTime(config.governanceCycleForm?.time);
  const cycleStageLengths = formToCycleStageLengths(config.governanceCycleForm);
  const cycleDayLastUpdated = dateAtTime(new Date(), cycleTriggerTime).toISOString();
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
  const cleanedConfig = omitKey(config, 'governanceCycleForm') as NanceConfig;
  const configIn = (spaceConfig) ? mergeConfig(spaceConfig.config, cleanedConfig) : mergeTemplateConfig(cleanedConfig);
  const packedConfig = JSON.stringify({ address, config: configIn });
  const cid = await dotPin(packedConfig);
  const ownersIn = [...(owners ?? []), address];
  dolt.setSpaceConfig(space, cid, ownersIn, configIn, cycleCurrentDay, cycleTriggerTime, cycleStageLengths, cycleDayLastUpdated).then(() => {
    res.json({ success: true, data: { space, spaceOwners: ownersIn } });
  }).catch((e) => {
    console.error(e);
    res.json({ success: false, error: e });
  });
});

export default router;
