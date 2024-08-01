import { SQLPayout } from "@nance/nance-sdk";
import { sum } from "lodash";
import { parseUnits, zeroAddress } from "viem";
import { JBSplit } from "../types";
import { saltBaeSprinkle } from "./sprinkle";

export const getFundingCyclePayoutData = async (payouts: SQLPayout[]): Promise<JBSplit[]> => {
  const totalUSD = sum(payouts.map((p) => p.amount));
  const totalUSDGwei = parseUnits(totalUSD.toFixed(9), 9);

  // accumulate distributionLimit
  let distributionLimit = 0n;

  // subtract the sum of the percentages from 1 so we can sprinkle the remainder
  let percentageRemainder = parseUnits("1", 9);

  const _splits: JBSplit[] = payouts.map((p) => {
    const amountGwei = parseUnits(p.amount.toFixed(9), 9);
    const percent = (amountGwei * BigInt(1e9)) / totalUSDGwei;
    distributionLimit += amountGwei;
    percentageRemainder -= percent;
    const projectId = BigInt(p.payProject || 0);
    const beneficiary = (p.payAddress || zeroAddress) as `0x${string}`;
    const allocator = (p.payAllocator || zeroAddress) as `0x${string}`;
    return {
      preferClaimed: false,
      preferAddToBalance: false,
      percent,
      projectId,
      beneficiary,
      lockedUntil: 0n,
      allocator
    };
  });
  const distributionLimitWei = parseUnits(distributionLimit.toString(), 9);
  console.log("distributionLimitWei", distributionLimitWei);
  console.log("percentageRemainder", percentageRemainder);
  const splits = saltBaeSprinkle(_splits, percentageRemainder);
  // confirm that the sum of the percentages is 1
  console.log("sum of percentages", sum(_splits.map((s) => s.percent)));
  // confirm that the sum of the percentages is 1
  console.log("sum of percentages", sum(splits.map((s) => s.percent)));
  return splits;
};
