import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

import {
  JBFundingCycleDataStruct,
  JBFundingCycleStructOutput,
  JBFundingCycleMetadataStruct,
  JBFundingCycleMetadataStructOutput,
  JBGroupedSplitsStruct,
  JBFundAccessConstraintsStruct,
} from 'juice-sdk/dist/cjs/types/contracts/JBController';
import { MAX_DISTRIBUTION_LIMIT } from './juiceboxMath';

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
    global: { allowSetTerminals: data.global.allowSetTerminals, allowSetController: data.global.allowSetController },
    reservedRate: data.reservedRate,
    redemptionRate: data.redemptionRate,
    ballotRedemptionRate: data.ballotRedemptionRate,
    pausePay: data.pausePay,
    pauseDistributions: data.pauseDistributions,
    pauseRedeem: data.pauseRedeem,
    pauseBurn: data.pauseBurn,
    allowMinting: data.allowMinting,
    allowChangeToken: data.allowChangeToken,
    allowTerminalMigration: data.allowTerminalMigration,
    allowControllerMigration: data.allowControllerMigration,
    holdFees: data.holdFees,
    useTotalOverflowForRedemptions: data.useTotalOverflowForRedemptions,
    useDataSourceForPay: data.useDataSourceForPay,
    useDataSourceForRedeem: data.useDataSourceForRedeem,
    dataSource: data.dataSource
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
