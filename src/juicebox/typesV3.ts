import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

import {
  JBFundingCycleDataStruct,
  JBFundingCycleStructOutput,
  JBGlobalFundingCycleMetadataStruct,
  JBFundingCycleMetadataStructOutput,
  JBGroupedSplitsStruct,
  JBFundAccessConstraintsStruct,
} from 'juice-sdk-v3/dist/cjs/types/contracts/JBController';

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

export const getJBFundingCycleDataStruct = (
  data: JBFundingCycleStructOutput,
  weight: BigNumber,
  ballot: string
): JBFundingCycleDataStruct => {
  return {
    // duration: data.duration,
    duration: 1209600,
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
      allowSetController: data.global.allowSetController,
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
