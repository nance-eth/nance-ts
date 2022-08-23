import { BigNumber } from '@ethersproject/bignumber';

import {
  JBFundingCycleDataStruct,
  JBFundingCycleStructOutput,
  JBFundingCycleMetadataStruct,
  JBFundingCycleMetadataStructOutput,
  JBGroupedSplitsStruct,
  JBSplitStruct
} from 'juice-sdk/dist/cjs/types/contracts/JBController';

export const getJBFundingCycleDataStruct = (
  data: JBFundingCycleStructOutput,
  weight: BigNumber
): JBFundingCycleDataStruct => {
  return {
    duration: data.duration,
    weight,
    discountRate: data.discountRate,
    ballot: data.ballot
  };
};

export const getJBFundingCycleMetadataStruct = (
  data: JBFundingCycleMetadataStructOutput
): JBFundingCycleMetadataStruct => {
  return {
    global: data.global,
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
