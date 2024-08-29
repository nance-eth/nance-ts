import { discordLogin } from '../api/helpers/discord';
import { getSpaceConfig, getSpaceInfo } from '../api/helpers/getSpace';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { sleep } from '../utils';

async function main() {
  const { config, currentGovernanceCycle } = await getSpaceConfig(process.env.CONFIG || '');
  await sleep(2000);
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  const payouts = await dolt.getPayoutsDb(currentGovernanceCycle);
  const discord = await discordLogin(config);
  await discord.sendPayoutsTable(payouts, currentGovernanceCycle);
}

main();
