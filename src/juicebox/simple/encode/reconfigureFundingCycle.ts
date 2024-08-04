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

export function viemReconfigureFundingCyclesOf(fc: JBReconfigureFundingCycleData): string {
  const data = {
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
  };
  const replacer = (_: string, value: any) => {
    if (typeof value === 'bigint') {
      return `${value.toString()}n`;
    }
    return value;
  };

  // Convert the data to a JSON string
  let formattedString = JSON.stringify({ args: [data] }, replacer, 2);

  // Remove the outer object and array
  formattedString = formattedString.replace(/^\{\s*"args":\s*\[\n/, '');
  formattedString = formattedString.replace(/\n\s*\]\n\}$/, '');

  // Remove quotes around property names
  formattedString = formattedString.replace(/"(\w+)":/g, '$1:');
  // Remove quotes around BigInt values (ending with 'n')
  formattedString = formattedString.replace(/"(\d+n)"/g, '$1');

  return formattedString;
}
