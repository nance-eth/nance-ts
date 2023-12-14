import express from 'express';
import { getSpaceConfig } from './helpers/getSpace';
import { addressFromJWT } from './helpers/auth';
import { isNanceSpaceOwner } from './helpers/permissions';
import { sendDailyAlert } from '../tasks/sendDailyAlert';
import { temperatureCheckRollup } from '../tasks/temperatureCheckRollup';
import { SpaceConfig } from '../dolt/schema';
import { temperatureCheckClose } from '../tasks/temperatureCheckClose';
import { voteSetup } from '../tasks/voteSetup';
import { voteRollup } from '../tasks/voteRollup';
import { incrementGovernanceCycle } from '../tasks/incrementGovernanceCycle';
import { addSecondsToDate } from '../utils';
import { voteClose } from '../tasks/voteClose';
import { voteResultsRollup } from '../tasks/voteResultsRollup';

const router = express.Router();

// validate headers have valid JWT that is the spaceOwner before any other requests
router.use('/:space', async (req, res, next) => {
  try {
    const { space } = req.params;
    const jwt = req.headers.authorization?.split('Bearer ')[1];
    const address = (jwt && jwt !== 'null') ? await addressFromJWT(jwt) : null;
    if (!address) { res.json({ success: false, error: 'no SIWE address found' }); return; }
    const spaceConfig = await getSpaceConfig(space);
    if (!isNanceSpaceOwner(spaceConfig.spaceOwners, address)) {
      res.json({ success: false, error: `address ${address} is not a spaceOwner of ${space}` });
      return;
    }
    res.locals.spaceConfig = spaceConfig;
    next();
  } catch (e) {
    res.json({ success: false, error: e });
    res.status(500);
  }
});

router.get('/:space/dailyAlert', async (req, res) => {
  const { space } = req.params;
  sendDailyAlert(space).then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/:space/incrementGovernanceCycle', async (req, res) => {
  const { spaceConfig } = res.locals as { spaceConfig: SpaceConfig };
  incrementGovernanceCycle(spaceConfig.config.name).then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/:space/temperatureCheckStart', async (req, res) => {
  const { endDate } = req.query;
  const { spaceConfig } = res.locals as { spaceConfig: SpaceConfig };
  const temperatureCheckEndDate = endDate ? new Date(endDate as string) : new Date(addSecondsToDate(new Date(), 3600));
  temperatureCheckRollup(spaceConfig.config, temperatureCheckEndDate).then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/:space/temperatureCheckClose', async (req, res) => {
  const { spaceConfig } = res.locals as { spaceConfig: SpaceConfig };
  temperatureCheckClose(spaceConfig.config).then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/:space/voteSetup', async (req, res) => {
  try {
    const { endDate } = req.query;
    const { spaceConfig } = res.locals as { spaceConfig: SpaceConfig };
    const voteEndDate = endDate ? new Date(endDate as string) : new Date(addSecondsToDate(new Date(), 3600));
    const proposals = await voteSetup(spaceConfig.config, voteEndDate);
    await voteRollup(spaceConfig.config, voteEndDate, proposals);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get('/:space/voteClose', async (req, res) => {
  try {
    const { spaceConfig } = res.locals as { spaceConfig: SpaceConfig };
    const proposals = await voteClose(spaceConfig.config);
    await voteResultsRollup(spaceConfig.config, proposals);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

export default router;