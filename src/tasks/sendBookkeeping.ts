import {
  NanceConfig,
  SQLPayout,
  Proposal,
  Payout,
  getPayoutCountAmount
} from "@nance/nance-sdk";
import { discordLogin } from "../api/helpers/discord";
import { getSpaceConfig } from "../api/helpers/getSpace";
import { getDb } from "../dolt/pools";
import logger from "../logging";
import { getProjectHandle } from "../juicebox/api";
import { getENS } from "../api/helpers/ens";

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
  proposal.actions?.forEach((action, index) => {
    if (action.type === "Payout") {
      const { amount, count } = getPayoutCountAmount(action);
      const gc = proposal?.actions?.[index].actionTracking?.[0].governanceCycle || 0;
      const cancelled = proposal?.actions?.[index].actionTracking?.find((g) => g.governanceCycle === currentGovernanceCycle)?.status === "Cancelled";
      const payout = action.payload as Payout;
      const include = gc + count - 1 >= currentGovernanceCycle;
      if (!include || cancelled) return;
      sqlPayouts.push({
        uuidOfPayout: action?.uuid || "",
        uuidOfProposal: proposal.uuid,
        treasuryVersion: 3,
        governanceCycleStart: gc,
        numberOfPayouts: count,
        lockedUntil: 0,
        amount: Number(amount),
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

export const gatherPayouts = async (space: string, currentGovernanceCycle: number) => {
  try {
    const dolt = getDb(space);
    const payouts: SQLPayout[] = [];
    const previousGovernanceCycles = getGovernanceCycles(currentGovernanceCycle);
    const { proposals } = await dolt.getProposals(
      { governanceCycle: previousGovernanceCycles,
        status: ["Approved"]
      });

    proposals.forEach((p) => {
      const sqlPayouts = getSQLPayoutsFromProposal(p, currentGovernanceCycle);
      if (sqlPayouts) payouts.push(...sqlPayouts);
    });

    if (payouts.length === 0) return undefined;
    const formattedPayouts = await formatPayouts(payouts.reverse());
    return formattedPayouts;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const sendBookkeeping = async (space: string, config: NanceConfig, testConfig?: NanceConfig) => {
  try {
    const { currentGovernanceCycle } = await getSpaceConfig(space);
    const payouts = await gatherPayouts(space, currentGovernanceCycle);
    if (!payouts) return;
    const dialogHandler = await discordLogin(testConfig || config);
    await dialogHandler.sendPayoutsTable(payouts, currentGovernanceCycle);
  } catch (e) {
    logger.error(`Error sending bookkeeping for ${space}`);
    logger.error(e);
  }
};
