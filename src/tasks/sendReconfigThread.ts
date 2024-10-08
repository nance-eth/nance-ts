import { NanceConfig } from "@nance/nance-sdk";
import { sum } from "lodash";
import SafeApiKit from "@safe-global/api-kit";
import { gatherPayouts } from "./sendBookkeeping";
import { getSpaceConfig, getSpaceInfo } from "../api/helpers/getSpace";
import { discordLogin } from "../api/helpers/discord";
import { getFundingCyclePayoutData } from "../juicebox/simple/helpers/payouts";
import { JBReconfigureFundingCycleData } from "../juicebox/simple/types";
import { reconfigureFundingCyclesOf, viemReconfigureFundingCyclesOf } from "../juicebox/simple/encode/reconfigureFundingCycle";
import { TenderlyHandler } from "../tenderly/tenderlyHandler";
import { JBController3_1_Address } from "../juicebox/simple/contracts/JBController3_1";
import { distributePayoutsOf } from "../juicebox/simple/encode/distributePayouts";
import { JBETHPaymentTerminal3_1_2_Address } from "../juicebox/simple/contracts/JBETHPaymentTerminal3_1_2";
import { dateAtTime, networkNameToChainId } from "../utils";
import {
  defaultFundingCycleData,
  DISTRIBUTION_CURRENCY_USD,
  GROUP_PAYOUTS,
  GROUP_RESERVED,
  TOKEN_ETH
} from "../juicebox/simple/constants";

const JUICEBOX_TRIGGER_TIME = "19:19:33";

type SendReconfigThreadInputs = {
  space: string;
  config: NanceConfig;
  testConfig?: NanceConfig;
  safeTxnUrl?: string;
};

export const sendReconfigThread = async ({ space, config, testConfig, safeTxnUrl }: SendReconfigThreadInputs) => {
  try {
    const spaceConfig = await getSpaceConfig(space);
    const spaceInfo = getSpaceInfo(spaceConfig);
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
      { name: "🗃 Juicebox Safe Diff", value: "https://juicebox.money/@juicebox/safe", inline: true },
    ];

    if (safeTxnUrl) {
      links.push({
        name: "✍️ Safe Transaction",
        value: safeTxnUrl,
        inline: true
      });
    }

    // get next Safe nonce
    const networkId = networkNameToChainId(config.juicebox.network);
    const safe = new SafeApiKit({ chainId: BigInt(networkId) });
    const nonce = await safe.getNextNonce(config.juicebox.gnosisSafeAddress);

    // discord
    const discord = await discordLogin(testConfig || config);
    const threadId = await discord.createLinkThread(nonce - 1, `Queue GC#${currentGovernanceCycle}`, links);
    let governanceCycleExecution;
    if (spaceInfo.currentEvent.title === "Execution") {
      governanceCycleExecution = spaceInfo.currentEvent.end;
    } else {
      governanceCycleExecution = spaceInfo.nextEvents.find((e) => e.title === "Execution")?.end || spaceInfo.currentEvent.end;
    }
    const deadline = dateAtTime(new Date(governanceCycleExecution), JUICEBOX_TRIGGER_TIME);
    await discord.sendReconfigSummary(currentGovernanceCycle, threadId, deadline, lastTotalUSD, totalUSD, addedPayouts, removedPayouts, encodedReconfigureFundingCycle, viemFormat);
    return payouts;
  } catch (e) {
    return Promise.reject(e);
  }
};
