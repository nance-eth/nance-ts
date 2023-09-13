import { Nance } from '../nance';
import { addSecondsToDate } from '../utils';
import { Proposal } from '../types';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { pools } from '../dolt/pools';
import { getCurrentAndNextEvent } from '../dolt/helpers/cycleConfigToDateEvent';

const pageId = '';

async function getConfigs() {
  const doltSys = new DoltSysHandler(pools.nance_sys); 
  const spaceConfig = await doltSys.getSpaceConfig(process.env.CONFIG || '');
  const [currentEvent] = getCurrentAndNextEvent(spaceConfig);
  const nance = new Nance(spaceConfig.config);
  console.log(currentEvent);
  const now = new Date();
  const voteEnd = (currentEvent.end < now) ? addSecondsToDate(now, 60 * 5) : currentEvent.end
  nance.votingSetup(voteEnd);
}

getConfigs();
