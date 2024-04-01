import express from 'express';
import { SpaceConfig } from '@nance/nance-sdk';
import { getSpaceConfig } from './helpers/getSpace';
import { addressFromJWT } from './helpers/auth';
import { isNanceSpaceOwner } from './helpers/permissions';
import { sendDailyAlert } from '../tasks/sendDailyAlert';
import { temperatureCheckRollup } from '../tasks/temperatureCheckRollup';
import { temperatureCheckClose } from '../tasks/temperatureCheckClose';
import { voteSetup } from '../tasks/voteSetup';
import { voteRollup } from '../tasks/voteRollup';
import { incrementGovernanceCycle } from '../tasks/incrementGovernanceCycle';
import { addSecondsToDate } from '../utils';
import { voteClose } from '../tasks/voteClose';
import { voteResultsRollup } from '../tasks/voteResultsRollup';
import { getNextEventByName } from './helpers/getNextEventByName';
import { EVENTS } from '../constants';

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
    res.locals.space = space;
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
  const { space, spaceConfig } = res.locals as { space: string, spaceConfig: SpaceConfig };
  incrementGovernanceCycle(spaceConfig.space).then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/:space/temperatureCheckStart', async (req, res) => {
  const { endDate } = req.query;
  const { space, spaceConfig } = res.locals as { space: string, spaceConfig: SpaceConfig };
  const temperatureCheckEndDate = endDate ? new Date(endDate as string)
    : getNextEventByName(EVENTS.TEMPERATURE_CHECK, spaceConfig)?.end
    || new Date(addSecondsToDate(new Date(), 3600));
  temperatureCheckRollup(space, spaceConfig.config, temperatureCheckEndDate).then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/:space/temperatureCheckClose', async (req, res) => {
  const { space, spaceConfig } = res.locals as { space: string, spaceConfig: SpaceConfig };
  temperatureCheckClose(space, spaceConfig.config).then(() => {
    res.json({ success: true });
  }).catch((e) => {
    res.json({ success: false, error: e });
  });
});

router.get('/:space/voteSetup', async (req, res) => {
  try {
    const { endDate } = req.query;
    const { space, spaceConfig } = res.locals as { space: string, spaceConfig: SpaceConfig };
    const voteEndDate = endDate ? new Date(endDate as string)
      : getNextEventByName(EVENTS.SNAPSHOT_VOTE, spaceConfig)?.end
      || new Date(addSecondsToDate(new Date(), 3600));
    const proposals = await voteSetup(space, spaceConfig.config, voteEndDate);
    await voteRollup(space, spaceConfig.config, voteEndDate, proposals);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

router.get('/:space/voteClose', async (req, res) => {
  try {
    const { space, spaceConfig } = res.locals as { space: string, spaceConfig: SpaceConfig };
    const proposals = await voteClose(space, spaceConfig.config);
    await voteResultsRollup(space, spaceConfig.config, proposals);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

export default router;
