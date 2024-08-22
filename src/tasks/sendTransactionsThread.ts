import { NanceConfig } from "@nance/nance-sdk";
import { sum } from "lodash";
import { gatherPayouts } from "./sendBookkeeping";
import { getSpaceConfig, getSpaceInfo } from "../api/helpers/getSpace";
import { SafeHandler } from "../safe/safeHandler";
import { discordLogin } from "../api/helpers/discord";
import { getFundingCyclePayoutData } from "../juicebox/simple/helpers/payouts";
import { JBReconfigureFundingCycleData } from "../juicebox/simple/types";
import { reconfigureFundingCyclesOf, viemReconfigureFundingCyclesOf } from "../juicebox/simple/encode/reconfigureFundingCycle";
import { TenderlyHandler } from "../tenderly/tenderlyHandler";
import { JBController3_1_Address } from "../juicebox/simple/contracts/JBController3_1";
import { distributePayoutsOf } from "../juicebox/simple/encode/distributePayouts";
import { JBETHPaymentTerminal3_1_2_Address } from "../juicebox/simple/contracts/JBETHPaymentTerminal3_1_2";
import {
  defaultFundingCycleData,
  DISTRIBUTION_CURRENCY_USD,
  GROUP_PAYOUTS,
  GROUP_RESERVED,
  TOKEN_ETH
} from "../juicebox/simple/constants";
import { dateAtTime } from "../utils";

const JUICEBOX_TRIGGER_TIME = "19:19:33";

export const sendTransactionThread = async (space: string, config: NanceConfig, testConfig?: NanceConfig) => {
  try {
    const spaceConfig = await getSpaceConfig(space);
    const spaceInfo = await getSpaceInfo(spaceConfig);
    const { currentGovernanceCycle } = spaceConfig;
    const lastGovernanceCycle = currentGovernanceCycle - 1;
    const lastCyclePayouts = await gatherPayouts(space, lastGovernanceCycle);
    const lastTotalUSD = sum(lastCyclePayouts?.map((p) => p.amount) || []);
    const payouts = await gatherPayouts(space, currentGovernanceCycle);
    const addedPayouts = payouts?.filter((p) => {
      return !lastCyclePayouts?.some((lp) => lp.uuidOfPayout === p.uuidOfPayout);
    }) || [];
    const removedPayouts = lastCyclePayouts?.filter((lp) => {
      return !payouts?.some((p) => p.uuidOfPayout === lp.uuidOfPayout);
    }) || [];
    console.log("addedPayouts", addedPayouts?.map((p) => p.uuidOfPayout));
    console.log("removedPayouts", removedPayouts?.map((p) => p.uuidOfPayout));
    if (!payouts) return undefined;
    const currentNonce = await SafeHandler.getCurrentNonce(
      config.juicebox.gnosisSafeAddress,
      config.juicebox.network,
      true
    );

    // turn the payouts into splits and distribution limits
    const { splits, distributionLimit, totalUSD } = getFundingCyclePayoutData(payouts);

    // merge the splits into the default funding cycle data
    const fundingCycleData: JBReconfigureFundingCycleData = {
      ...defaultFundingCycleData,
      groupedSplits: [
        { group: GROUP_PAYOUTS, splits },
        { group: GROUP_RESERVED, splits: [] }
      ],
      fundAccessConstraints: [{
        ...defaultFundingCycleData.fundAccessConstraints[0],
        distributionLimit
      }]
    };

    const encodedReconfigureFundingCycle = reconfigureFundingCyclesOf(fundingCycleData);
    const viemFormat = viemReconfigureFundingCyclesOf(fundingCycleData);

    // tenderly simulation
    const tenderly = new TenderlyHandler({ account: "jigglyjams", project: "nance" });
    await tenderly.getForkProvider(`GC#${currentGovernanceCycle}_${new Date().toISOString()}`);
    await tenderly.sendTransaction({
      address: JBController3_1_Address,
      data: encodedReconfigureFundingCycle,
      from: config.juicebox.gnosisSafeAddress
    });
    // move forward in time and ensure distributePayoutsOf works
    await tenderly.advanceTime(18 * 24 * 60 * 60);
    const encodeDistributePayouts = distributePayoutsOf({
      projectId: 1n,
      amount: distributionLimit,
      currency: DISTRIBUTION_CURRENCY_USD,
      token: TOKEN_ETH,
      minReturnedTokens: 0n,
      metadata: "0x00"
    });
    await tenderly.sendTransaction({
      address: JBETHPaymentTerminal3_1_2_Address,
      data: encodeDistributePayouts,
      from: config.juicebox.gnosisSafeAddress
    });
    const publicForkURL = tenderly.getForkURL();
    const links = [
      { name: "🧱 Tenderly Simulation", value: publicForkURL, inline: true },
      { name: "🗃 Juicebox Safe Diff", value: "https://juicebox.money/@juicebox/safe", inline: true }
    ];
    // discord
    const nonce = currentNonce + 1;
    const discord = await discordLogin(testConfig || config);
    const threadId = await discord.createTransactionThread(nonce, "Queue Cycle", links);
    const governanceCycleExecution = spaceInfo.nextEvents.find((e) => e.title === "Execution")?.end || new Date();
    const deadline = dateAtTime(new Date(governanceCycleExecution), JUICEBOX_TRIGGER_TIME);
    await discord.sendTransactionSummary(currentGovernanceCycle, threadId, deadline, lastTotalUSD, totalUSD, addedPayouts, removedPayouts, encodedReconfigureFundingCycle, viemFormat);
    return payouts;
  } catch (e) {
    return Promise.reject(e);
  }
};
