import express from 'express';
import { ConfigSpaceRequest, SpaceInfo } from '@nance/nance-sdk';
import { createDolthubDB, headToUrl } from '@/dolt/doltAPI';
import { dotPin } from '@/storage/storageHandler';
import { mergeTemplateConfig, mergeConfig, uuidGen } from '@/utils';
import logger from '@/logging';
import { getDb, getSysDb } from '@/dolt/pools';
import { addressFromJWT } from '@/api/helpers/auth';
import { getAllSpaceInfo, getSpaceConfig } from '@/api/helpers/getSpace';

const router = express.Router();

router.get('/', (_, res) => {
  res.send('nance-ish control panel');
});

router.get('/uuid', async (_, res) => {
  res.json({ success: true, data: uuidGen() });
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
  const infos: SpaceInfo[] = [];
  getAllSpaceInfo().then(async (data) => {
    await Promise.all(data.map(async (space, index) => {
      try {
        const dolt = getDb(space.name);
        const spaceInfo: SpaceInfo = {
          ...space,
          dolthubLink: headToUrl(space.config.dolt.owner, space.config.dolt.repo),
          nextProposalId: await dolt.getNextProposalId(),
        };
        if (space.config.juicebox.gnosisSafeAddress || space.config.juicebox.governorAddress) {
          spaceInfo.transactorAddress = {
            type: space.config.juicebox.gnosisSafeAddress ? 'safe' : 'governor',
            network: space.config.juicebox.network,
            address: space.config.juicebox.gnosisSafeAddress || space.config.juicebox.governorAddress,
          };
        }
        infos[index] = (spaceInfo); // preserve order
      } catch (e) {
        // If there's an error, we don't push anything to infos
      }
    }));
    res.json({ success: true, data: infos });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.post('/config', async (req, res) => {
  const { config, spaceOwners, dryrun } = req.body as ConfigSpaceRequest;
  const space = config.name.replaceAll(' ', '_').toLowerCase();
  const spaceConfig = await getSpaceConfig(space);
  const displayName = config.name;

  // get address from jwt (SIWE)
  const jwt = req.headers.authorization?.split('Bearer ')[1];
  const address = (jwt && jwt !== 'null') ? await addressFromJWT(jwt) : null;
  if (!address) { res.json({ success: false, error: '[NANCE ERROR]: no SIWE address found' }); return; }

  // check if space exists and configurer is spaceOwner
  if (spaceConfig && !spaceConfig.spaceOwners.includes(address)) {
    res.json({ success: false, error: '[NANCE ERROR] configurer not spaceOwner!' });
    return;
  }

  // config the space in nance_sys database
  const configIn = (spaceConfig) ? mergeConfig(spaceConfig.config, config) : mergeTemplateConfig(config);
  configIn.proposalIdPrefix = config.proposalIdPrefix.includes('-') ? config.proposalIdPrefix : `${config.proposalIdPrefix}-`;
  const packedConfig = JSON.stringify({ address, config: configIn });
  const cid = await dotPin(packedConfig);
  const spaceOwnersIn = spaceOwners.map((owner) => { return owner.address; });
  if (!dryrun) {
    getSysDb().setSpaceConfig({
      space,
      displayName,
      cid,
      spaceOwners: spaceOwnersIn,
      config: configIn,
      autoEnable: 1,
    }).then(() => {
      res.json({ success: true, data: { space, spaceOwners: spaceOwnersIn } });
    }).catch((e) => {
      console.error(e);
      res.json({ success: false, error: e });
    });
  } else {
    console.log('dryrun');
    console.log(space, displayName, cid, spaceOwnersIn, configIn,);
    res.json({ success: true, data: { dryrun, space, displayName, cid, spaceOwnersIn, configIn, } });
  }

  // create space database if it doesn't exist
  logger.info(`[CREATE SPACE]: ${JSON.stringify(config)}`);
  if (!spaceConfig) {
    if (!dryrun) {
      getSysDb().createSpaceDB(space).then(async () => {
        const dolt = getDb(space);
        try { await getSysDb().createSchema(space); } catch (e) { logger.error(e); }
        try { await createDolthubDB(space); } catch (e) { logger.error(e); }
        try { await dolt.localDolt.addRemote(`https://doltremoteapi.dolthub.com/nance/${space}`); } catch (e) { logger.error(e); }
        try { await dolt.localDolt.push(true); } catch (e) { logger.error(e); }
      }).catch((e) => {
        logger.error('[CREATE SPACE]:');
        logger.error(e);
      });
    }
  }
});

export default router;
