import { NanceConfig, SQLPayout } from '@nance/nance-sdk';
import { discordLogin } from '../api/helpers/discord';
import { getSpaceConfig } from '../api/helpers/getSpace';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import logger from '../logging';
import { getProjectHandle } from '../juicebox/api';
import { getENS } from '../api/helpers/ens';

const formatPayouts = async (payouts: SQLPayout[]): Promise<SQLPayout[]> => {
  return Promise.all(payouts.map(async (payout) => {
    const { payAddress, payProject } = payout;
    const ens = await getENS(payAddress);
    const payENS = (ens === payAddress) ? undefined : ens;
    const payProjectHandle = (payProject) ? await getProjectHandle(payProject?.toString()) : undefined;
    return {
      ...payout,
      payENS,
      payProjectHandle
    };
  }));
};

export const sendBookkeeping = async (space: string, config: NanceConfig, testConfig?: NanceConfig) => {
  try {
    const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
    const { currentGovernanceCycle } = await getSpaceConfig(space);
    await dolt.setStalePayouts(currentGovernanceCycle);
    const payouts = await dolt.getPayoutsDb(currentGovernanceCycle);
    if (payouts.length === 0) return;
    const dialogHandler = await discordLogin(testConfig || config);
    await dialogHandler.sendPayoutsTable(await formatPayouts(payouts), currentGovernanceCycle);
  } catch (e) {
    logger.error(`Error sending bookkeeping for ${space}`);
    logger.error(e);
  }
};
