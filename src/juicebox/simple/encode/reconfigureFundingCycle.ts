import { encodeFunctionData } from "viem";
import { JBReconfigureFundingCycleData } from "../types";
import { JBController3_1_ABI } from "../contracts/JBController3_1";

export function reconfigureFundingCyclesOf(fc: JBReconfigureFundingCycleData) {
  return encodeFunctionData({
    abi: JBController3_1_ABI,
    functionName: "reconfigureFundingCyclesOf",
    args: [
      fc.projectId,
      fc.data,
      fc.metadata,
      fc.mustStartOnOrAfter,
      fc.groupedSplits,
      fc.fundAccessConstraints,
      fc.memo
    ]
  });
}
