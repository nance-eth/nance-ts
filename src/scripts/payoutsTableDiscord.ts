import { discordLogin } from '../api/helpers/discord';
import { getSpaceInfo } from '../api/helpers/getSpace';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { sleep } from '../utils';

async function main() {
  const { config, currentCycle } = await getSpaceInfo(process.env.CONFIG || '');
  await sleep(2000);
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  const payouts = await dolt.getPayoutsDb(currentCycle);
  const discord = await discordLogin(config);
  await discord.sendPayoutsTable(payouts, currentCycle);
}

main();
