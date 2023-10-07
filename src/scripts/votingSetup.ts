import { getSpaceInfo } from '../api/helpers/getSpace';
import { Nance } from '../nance';
import { addSecondsToDate } from '../utils';

async function main() {
  const { config, currentEvent } = await getSpaceInfo(process.env.CONFIG || '');
  const nance = new Nance(config);
  const now = new Date();
  const voteEnd = (currentEvent.end < now) ? addSecondsToDate(now, 60 * 5) : currentEvent.end
  nance.votingSetup(voteEnd);
}

main();
