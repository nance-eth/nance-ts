import { encodeFunctionData } from "viem";
import { JBDistributePayoutsOfData } from "../types";
import { JBETHPaymentTerminal3_1_2_ABI } from "../contracts/JBETHPaymentTerminal3_1_2";

export function distributePayoutsOf(distributePayoutsOfData: JBDistributePayoutsOfData) {
  const {
    projectId,
    amount,
    currency,
    token,
    minReturnedTokens,
    metadata
  } = distributePayoutsOfData;

  return encodeFunctionData({
    abi: JBETHPaymentTerminal3_1_2_ABI,
    functionName: "distributePayoutsOf",
    args: [
      projectId,
      amount,
      currency,
      token,
      minReturnedTokens,
      metadata
    ]
  });
}
