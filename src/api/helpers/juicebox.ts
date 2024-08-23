import { SQLPayout } from "@nance/nance-sdk";
import { deepStringify } from "@/utils";
import { getFundingCyclePayoutData } from "@/juicebox/simple/helpers/payouts";
import { JBReconfigureFundingCycleData } from "@/juicebox/simple/types";
import { defaultFundingCycleData, GROUP_PAYOUTS, GROUP_RESERVED } from "@/juicebox/simple/constants";
import { reconfigureFundingCyclesOf } from "@/juicebox/simple/encode/reconfigureFundingCycle";

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
