import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

import {
  JBFundingCycleDataStruct,
  JBFundingCycleStructOutput,
  JBGlobalFundingCycleMetadataStruct,
  JBFundingCycleMetadataStructOutput,
  JBGroupedSplitsStruct,
  JBFundAccessConstraintsStruct,
  JBSplitStructOutput,
} from '@jigglyjams/juice-sdk-v3/dist/cjs/types/contracts/JBController';
import { JBSplitStruct } from '../types';
import { MAX_DISTRIBUTION_LIMIT } from './juiceboxMath';

export declare type JBFundingCycleMetadataStruct = {
  global: JBGlobalFundingCycleMetadataStruct;
  reservedRate: BigNumberish;
  redemptionRate: BigNumberish;
  ballotRedemptionRate: BigNumberish;
  pausePay: boolean;
  pauseDistributions: boolean;
  pauseRedeem: boolean;
  pauseBurn: boolean;
  allowMinting: boolean;
  allowTerminalMigration: boolean;
  allowControllerMigration: boolean;
  holdFees: boolean;
  preferClaimedTokenOverride: boolean;
  useTotalOverflowForRedemptions: boolean;
  useDataSourceForPay: boolean;
  useDataSourceForRedeem: boolean;
  dataSource: string;
  metadata: BigNumberish;
};

const DISTRIBUTION_PAYOUT_SCALAR = 18;

export type ReconfigurationBallotAddresses = {
  0: string,
  3: string,
  7: string
};

export type BallotKey = keyof ReconfigurationBallotAddresses;

export type ReconfigureFundingCyclesOfData = [
  BigNumberish,
  JBFundingCycleDataStruct,
  JBFundingCycleMetadataStruct,
  BigNumberish,
  JBGroupedSplitsStruct[],
  JBFundAccessConstraintsStruct[],
  string
];

export type DistributePayoutsOfData = [
  BigNumberish,
  BigNumberish,
  BigNumberish,
  string,
  BigNumberish,
  string
];

export const getJBFundingCycleDataStruct = (
  data: JBFundingCycleStructOutput,
  weight: BigNumber,
  ballot: string
): JBFundingCycleDataStruct => {
  return {
    duration: data.duration,
    weight,
    discountRate: data.discountRate,
    ballot
  };
};

export const getJBFundingCycleMetadataStruct = (
  data: JBFundingCycleMetadataStructOutput
): JBFundingCycleMetadataStruct => {
  return {
    global: {
      allowSetTerminals: data.global.allowSetTerminals,
      allowSetController: true,
      pauseTransfers: data.global.pauseTransfers
    },
    reservedRate: data.reservedRate,
    redemptionRate: data.redemptionRate,
    ballotRedemptionRate: data.ballotRedemptionRate,
    pausePay: data.pausePay,
    pauseDistributions: data.pauseDistributions,
    pauseRedeem: data.pauseRedeem,
    pauseBurn: data.pauseBurn,
    allowMinting: data.allowMinting,
    allowTerminalMigration: data.allowTerminalMigration,
    allowControllerMigration: data.allowControllerMigration,
    holdFees: data.holdFees,
    preferClaimedTokenOverride: false,
    useTotalOverflowForRedemptions: data.useTotalOverflowForRedemptions,
    useDataSourceForPay: data.useDataSourceForPay,
    useDataSourceForRedeem: data.useDataSourceForRedeem,
    dataSource: data.dataSource,
    metadata: 0
  };
};

export const getJBFundAccessConstraintsStruct = (
  terminal: string,
  token: string,
  distributionLimitIn: number,
  distributionLimitCurrency: number,
  overflowAllowance: number,
  overflowAllowanceCurrency: number
): JBFundAccessConstraintsStruct[] => {
  const distributionLimit = (distributionLimitIn === 100)
    ? MAX_DISTRIBUTION_LIMIT
    : BigNumber.from(distributionLimitIn).mul(BigNumber.from(10).pow(DISTRIBUTION_PAYOUT_SCALAR));
  return [{
    terminal,
    token,
    distributionLimit,
    distributionLimitCurrency,
    overflowAllowance,
    overflowAllowanceCurrency
  }];
};

export const getJBSplit = (split: JBSplitStructOutput): JBSplitStruct => {
  return {
    preferClaimed: split.preferClaimed,
    preferAddToBalance: split.preferAddToBalance,
    percent: split.percent.toNumber(),
    projectId: split.projectId.toNumber(),
    beneficiary: split.beneficiary,
    lockedUntil: split.lockedUntil.toNumber(),
    allocator: split.allocator,
  };
};
