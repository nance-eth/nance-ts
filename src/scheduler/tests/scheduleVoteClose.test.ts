import schedule from 'node-schedule';
import retry from 'promise-retry';
import { TASKS } from '../../constants';
import * as tasks from '../../tasks/_tasks';
import { addSecondsToDate, sleep } from '../../utils';
import { getSpaceConfig } from '../../api/helpers/getSpace';
import { listScheduledJobs } from '../list';

// node-schedule uses local time by default
process.env.TZ = 'UTC';

async function main() {
  await sleep(1000);
  const { config: configWaterbox } = await getSpaceConfig('waterbox');
  const { config: configJuicebox } = await getSpaceConfig('juicebox');
  const now = new Date();
  const voteCloseDate = addSecondsToDate(now, 60);
  schedule.scheduleJob(`TEST:${TASKS.voteClose}`, voteCloseDate, async () => {
    const results = await retry(() => { return tasks.voteClose(configJuicebox, undefined, true); }, { retries: 3 });
    if (results) {
      tasks.voteResultsRollup(configWaterbox, results);
    }
  });
  listScheduledJobs();
}

main();
