import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

import {
  JBFundingCycleDataStruct,
  JBFundingCycleStructOutput,
  JBFundingCycleMetadataStruct,
  JBFundingCycleMetadataStructOutput,
  JBGroupedSplitsStruct,
  JBFundAccessConstraintsStruct,
} from 'juice-sdk/dist/cjs/types/contracts/JBController';

const DISTRIBUTION_PAYOUT_SCALAR = 18;

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
  distributionLimit: number,
  distributionLimitCurrency: number,
  overflowAllowance: number,
  overflowAllowanceCurrency: number
): JBFundAccessConstraintsStruct[] => {
  return [{
    terminal,
    token,
    distributionLimit: BigNumber.from(distributionLimit).mul(BigNumber.from(10).pow(DISTRIBUTION_PAYOUT_SCALAR)),
    distributionLimitCurrency,
    overflowAllowance,
    overflowAllowanceCurrency
  }];
};
