import { NanceConfig, SQLPayout, getActionsFromBody, Action, Proposal, Payout } from '@nance/nance-sdk';
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

const payActionToSQLPayout = (proposal: Proposal, action: Action): SQLPayout | undefined => {
  if (action.type !== "Payout") return undefined;
  const payout = action.payload as Payout;
  return {
    uuidOfPayout: action.uuid || "",
    uuidOfProposal: proposal.uuid,
    treasuryVersion: 3,
    governanceCycleStart: proposal.governanceCycle || 0,
    numberOfPayouts: Number(payout.count),
    lockedUntil: 0,
    amount: Number(payout.amountUSD),
    currency: "USD",
    payName: proposal.title,
    payAddress: payout.address,
    payProject: payout.project,
    proposalId: proposal.proposalId
  };
};

export const sendBookkeeping = async (space: string, config: NanceConfig, testConfig?: NanceConfig) => {
  try {
    const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
    const { currentGovernanceCycle } = await getSpaceConfig(space);
    await dolt.setStalePayouts(currentGovernanceCycle);
    const payouts = await dolt.getPayoutsDb(currentGovernanceCycle);
    const { proposals } = await dolt.getProposals(
      { governanceCycle: String(currentGovernanceCycle),
        status: ["Approved"]
      });
    const actionsFromProposals = proposals.map((p) => getActionsFromBody(p.body));
    const payoutsFromProposals: Action[] = [];
    actionsFromProposals.forEach((actions) => {
      actions?.forEach((a) => {
        if (a.type === "Payout") payoutsFromProposals.push(a);
      });
    });
    payoutsFromProposals.forEach((p, index) => payouts.push(payActionToSQLPayout(proposals[index], p) as unknown as SQLPayout));
    if (payouts.length === 0) return;
    const dialogHandler = await discordLogin(testConfig || config);
    await dialogHandler.sendPayoutsTable(await formatPayouts(payouts), currentGovernanceCycle);
  } catch (e) {
    logger.error(`Error sending bookkeeping for ${space}`);
    logger.error(e);
  }
};
