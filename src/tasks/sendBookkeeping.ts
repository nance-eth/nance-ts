import { NanceConfig, SQLPayout, getActionsFromBody, Action, Proposal, Payout } from '@nance/nance-sdk';
import { discordLogin } from '../api/helpers/discord';
import { getSpaceConfig } from '../api/helpers/getSpace';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import logger from '../logging';
import { getProjectHandle } from '../juicebox/api';
import { getENS } from '../api/helpers/ens';

const getGovernanceCycles = (currentGovernanceCycle: number) => {
  // return array of previous 20 governance cycles
  const previousGovernanceCycles = [currentGovernanceCycle];
  for (let i = 1; i <= 20; i += 1) {
    previousGovernanceCycles.push(currentGovernanceCycle - i);
  }
  return previousGovernanceCycles.join("+");
};

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

const getSQLPayoutsFromProposal = (proposal: Proposal, currentGovernanceCycle: number): SQLPayout[] | undefined => {
  const sqlPayouts: SQLPayout[] = [];
  proposal.actions?.forEach((action) => {
    if (action.type === 'Payout') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const gc = action.uuid === '22a8e7669e4a40ef974698422c3f847b' ? proposal.governanceCycle! + 1 : proposal.governanceCycle || 0;
      const payout = action.payload as Payout;
      const include = gc + Number(payout.count) - 1 >= currentGovernanceCycle;
      if (!include) return;
      sqlPayouts.push({
        uuidOfPayout: action?.uuid || "",
        uuidOfProposal: proposal.uuid,
        treasuryVersion: 3,
        governanceCycleStart: gc,
        numberOfPayouts: Number(payout.count),
        lockedUntil: 0,
        amount: Number(payout.amountUSD),
        currency: "USD",
        payName: proposal.title,
        payAddress: payout.address,
        payProject: payout.project,
        proposalId: proposal.proposalId
      });
    }
  });
  return sqlPayouts;
};

export const sendBookkeeping = async (space: string, config: NanceConfig, testConfig?: NanceConfig) => {
  try {
    const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
    const { currentGovernanceCycle } = await getSpaceConfig(space);
    await dolt.setStalePayouts(currentGovernanceCycle);
    const payouts = await dolt.getPayoutsDb(currentGovernanceCycle);
    const previousGovernanceCycles = getGovernanceCycles(currentGovernanceCycle);
    const { proposals } = await dolt.getProposals(
      { governanceCycle: previousGovernanceCycles,
        status: ["Approved"]
      });

    proposals.forEach((p) => {
      const proposalWithActions = {
        ...p,
        actions: getActionsFromBody(p.body)
      } as Proposal;
      const sqlPayouts = getSQLPayoutsFromProposal(proposalWithActions, currentGovernanceCycle);
      if (sqlPayouts) payouts.push(...sqlPayouts);
    });

    console.log(payouts);
    if (payouts.length === 0) return;
    const dialogHandler = await discordLogin(testConfig || config);
    await dialogHandler.sendPayoutsTable(await formatPayouts(payouts), currentGovernanceCycle);
  } catch (e) {
    logger.error(`Error sending bookkeeping for ${space}`);
    logger.error(e);
  }
};
