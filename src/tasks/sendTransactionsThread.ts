import { NanceConfig } from "@nance/nance-sdk";
import { gatherPayouts } from "./sendBookkeeping";
import { getSpaceConfig } from "../api/helpers/getSpace";
import { SafeHandler } from "../safe/safeHandler";
import { discordLogin } from "../api/helpers/discord";
import { getFundingCyclePayoutData } from "../juicebox/simple/helpers/payouts";

export const sendTransactionThread = async (space: string, config: NanceConfig, testConfig?: NanceConfig) => {
  try {
    const { currentGovernanceCycle } = await getSpaceConfig(space);
    const lastGovernanceCycle = currentGovernanceCycle - 1;
    const lastCyclePayouts = await gatherPayouts(space, lastGovernanceCycle);
    const payouts = await gatherPayouts(space, currentGovernanceCycle);
    const addedPayouts = payouts?.filter((p) => {
      return !lastCyclePayouts?.some((lp) => lp.uuidOfPayout === p.uuidOfPayout);
    });
    const removedPayouts = lastCyclePayouts?.filter((lp) => {
      return !payouts?.some((p) => p.uuidOfPayout === lp.uuidOfPayout);
    });
    console.log('addedPayouts', addedPayouts?.map((p) => p.uuidOfPayout));
    console.log('removedPayouts', removedPayouts?.map((p) => p.uuidOfPayout));
    if (!payouts) return undefined;
    const currentNonce = await SafeHandler.getCurrentNonce(
      config.juicebox.gnosisSafeAddress,
      config.juicebox.network,
      true
    );
    await getFundingCyclePayoutData(payouts!);

    const nonce = currentNonce + 1;
    return payouts;
  } catch (e) {
    return Promise.reject(e);
  }
};
