import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

import {
  PayoutModStructOutput,
  TicketModStructOutput,
  FundingCycleMetadataStructOutput,
  FundingCycleMetadataStruct,
  FundingCyclePropertiesStructOutput,
  FundingCyclePropertiesStruct
} from 'juice-sdk-v1/dist/cjs/types/contracts/TerminalV1';

const DISTRIBUTION_PAYOUT_SCALAR = 18;

export type ReconfigurationBallotAddresses = {
  0: string,
  3: string,
  7: string
};

export type BallotKey = keyof ReconfigurationBallotAddresses;

// export type ReconfigureFundingCyclesOfData = [
//   BigNumberish,
//   JBFundingCycleDataStruct,
//   JBFundingCycleMetadataStruct,
//   BigNumberish,
//   JBGroupedSplitsStruct[],
//   JBFundAccessConstraintsStruct[],
//   string
// ];

export const getFundingCycleMetadataStruct = (
  data: FundingCycleMetadataStructOutput
): FundingCycleMetadataStruct => {
  return {
    reservedRate: data.reservedRate,
    bondingCurveRate: data.bondingCurveRate,
    reconfigurationBondingCurveRate: data.reconfigurationBondingCurveRate
  };
};

export const getFundingCycleProperties = (
  data: FundingCyclePropertiesStructOutput,
  distributionLimit: number,
  distributionLimitCurrency: number,
  duration: number, // days
  discountRate: number,
  ballot: string
): FundingCyclePropertiesStruct => {
  return {
    target: distributionLimit,
    currency: distributionLimitCurrency,
    duration,
    cycleLimit: 0,
    discountRate,
    ballot
  }
}
)

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
