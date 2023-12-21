import express from 'express';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { createDolthubDB, headToUrl } from '../dolt/doltAPI';
import { dotPin } from '../storage/storageHandler';
import { ConfigSpaceRequest, SpaceInfo } from './models';
import { mergeTemplateConfig, mergeConfig, sleep } from '../utils';
import logger from '../logging';
import { pools } from '../dolt/pools';
import { dbOptions } from '../dolt/dbConfig';
import { DoltSQL } from '../dolt/doltSQL';
import { addressFromJWT } from './helpers/auth';
import { getAllSpaceInfo, getSpaceConfig } from './helpers/getSpace';
import { createCalendarAndCycleInfo } from '../calendar/create';

const router = express.Router();

const doltSys = new DoltSysHandler(pools.nance_sys);

router.get('/', (_, res) => {
  res.send('nance-ish control panel');
});

router.get('/config/:space', async (req, res) => {
  const { space } = req.params;
  getSpaceConfig(space).then((doltConfig) => {
    if (doltConfig) { res.json({ success: true, data: doltConfig }); return; }
    res.json({ success: false, error: `config ${space} not found!` });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/all', async (_, res) => {
  getAllSpaceInfo().then(async (data) => {
    const infos = await Promise.all(data.map(async (space) => {
      const spaceInfo: SpaceInfo = {
        name: space.name,
        displayName: space.displayName || space.name,
        currentCycle: space.currentCycle,
        currentEvent: space.currentEvent,
        spaceOwners: space.spaceOwners,
        snapshotSpace: space.config.snapshot.space,
        juiceboxProjectId: space.config.juicebox.projectId,
        dolthubLink: headToUrl(space.config.dolt.owner, space.config.dolt.repo, space.dolthubLink),
        nextProposalId: space.nextProposalId,
      };
      if (space.config.juicebox.gnosisSafeAddress || space.config.juicebox.governorAddress) {
        spaceInfo.transactorAddress = {
          type: space.config.juicebox.gnosisSafeAddress ? 'safe' : 'governor',
          network: space.config.juicebox.network,
          address: space.config.juicebox.gnosisSafeAddress || space.config.juicebox.governorAddress,
        };
      }
      return spaceInfo;
    }));
    res.json({ success: true, data: infos });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.post('/config', async (req, res) => {
  const { config, governanceCycleForm, owners, dryrun } = req.body as ConfigSpaceRequest;
  const { calendar, cycleTriggerTime, cycleStageLengths } = createCalendarAndCycleInfo(governanceCycleForm);
  const space = config.name.replaceAll(' ', '_').toLowerCase();
  const displayName = config.name;
  // get address from jwt (SIWE)
  const jwt = req.headers.authorization?.split('Bearer ')[1];
  const address = (jwt && jwt !== 'null') ? await addressFromJWT(jwt) : null;
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: no SIWE address found' }); return; }

  // check if space exists and configurer is spaceOwner
  const spaceConfig = await getSpaceConfig(space);
  if (spaceConfig && !spaceConfig.spaceOwners.includes(address)) {
    res.json({ success: false, error: '[NANCE ERROR] configurer not spaceOwner!' });
    return;
  }

  // config the space in nance_sys database
  const configIn = (spaceConfig) ? mergeConfig(spaceConfig.config, config) : mergeTemplateConfig(config);
  const packedConfig = JSON.stringify({ address, config: configIn });
  const cid = await dotPin(packedConfig);
  const ownersIn = [...(owners ?? []), address];
  if (!dryrun) {
    doltSys.setSpaceConfig(
      space,
      displayName,
      cid,
      ownersIn,
      configIn,
      calendar,
      cycleTriggerTime,
      cycleStageLengths,
    ).then(() => {
      res.json({ success: true, data: { space, spaceOwners: ownersIn } });
    }).catch((e) => {
      console.error(e);
      res.json({ success: false, error: e });
    });
  } else {
    console.log('dryrun');
    console.log(space, displayName, cid, ownersIn, configIn, calendar, cycleTriggerTime, cycleStageLengths);
    res.json({ success: true, data: { dryrun, space, displayName, cid, ownersIn, configIn, calendar, cycleTriggerTime, cycleStageLengths } });
  }

  // create space database if it doesn't exist
  logger.info(`[CREATE SPACE]: ${JSON.stringify(config)}`);
  if (!spaceConfig) {
    if (!dryrun) {
      doltSys.createSpaceDB(space).then(async () => {
        pools[space] = new DoltSQL(dbOptions(space));
        const dolt = new DoltHandler(pools[space], '');
        try { await doltSys.createSchema(space); } catch (e) { logger.error(e); }
        try { await createDolthubDB(space); } catch (e) { logger.error(e); }
        try { await dolt.localDolt.addRemote(`https://doltremoteapi.dolthub.com/nance/${space}`); } catch (e) { logger.error(e); }
        try { await dolt.insertAutoCommitAndPushEvent(); } catch (e) { logger.error(e); }
        try { await dolt.localDolt.push(true); } catch (e) { logger.error(e); }
      }).catch((e) => {
        logger.error('[CREATE SPACE]:');
        logger.error(e);
      });
    }
  }
});

export default router;
