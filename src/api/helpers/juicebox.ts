import { SQLPayout } from "@nance/nance-sdk";
import { JuiceboxHandlerV3 } from "../../juicebox/juiceboxHandlerV3";
import { deepStringify, myProvider, unixTimeStampNow } from "../../utils";
import { getFundingCyclePayoutData } from "../../juicebox/simple/helpers/payouts";
import { JBReconfigureFundingCycleData } from "../../juicebox/simple/types";
import { defaultFundingCycleData, GROUP_PAYOUTS, GROUP_RESERVED } from "../../juicebox/simple/constants";
import { reconfigureFundingCyclesOf } from "../../juicebox/simple/encode/reconfigureFundingCycle";

export async function juiceboxTime(projectId: string, network = "mainnet" as "mainnet" | "goerli") {
  const juicebox = new JuiceboxHandlerV3(projectId, myProvider(network), network);
  const currentConfiguration = await juicebox.currentConfiguration();
  // TODO update to read delay period from contract
  const delay = 3 * 24 * 3600;
  const nowTimestamp = unixTimeStampNow();
  const startTimestamp = currentConfiguration.start.toNumber();
  const duration = currentConfiguration.duration.toNumber();
  const currentGovernanceCycle = currentConfiguration.number.toNumber();
  const endTimestamp = (startTimestamp + duration);
  const cycleCurrentDay = Math.floor((nowTimestamp - startTimestamp) / (24 * 3600));
  const daysRemainingToSubmitReconfig = Math.floor((endTimestamp - delay - nowTimestamp) / (24 * 3600));
  return {
    currentGovernanceCycle,
    cycleCurrentDay,
    start: startTimestamp * 1000,
    end: endTimestamp * 1000,
    delay,
    daysRemainingToSubmitReconfig
  };
}

export function buildJBReconfiguration(payouts: SQLPayout[]): { encoded: `0x${string}`, decoded: any } {
  const { splits, distributionLimit } = getFundingCyclePayoutData(payouts);
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

  return {
    encoded: reconfigureFundingCyclesOf(fundingCycleData),
    decoded: deepStringify(fundingCycleData)
  };
}
