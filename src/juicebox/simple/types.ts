// =============================================================================
// ============================= Controller Types ==============================
// =============================================================================

export type JBFundingCycleData = {
  duration: bigint;
  weight: bigint;
  discountRate: bigint;
  ballot: `0x${string}`;
};

export type JBFundingCycleMetadata = {
  global: {
    allowSetTerminals: boolean;
    allowSetController: boolean;
    pauseTransfers: boolean;
  };
  reservedRate: bigint;
  redemptionRate: bigint;
  ballotRedemptionRate: bigint;
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
  dataSource: `0x${string}`;
  metadata: bigint;
};

export type JBSplit = {
  preferClaimed: boolean;
  preferAddToBalance: boolean;
  percent: bigint;
  projectId: bigint;
  beneficiary: `0x${string}`;
  lockedUntil: bigint;
  allocator: `0x${string}`;
};

export type JBGroupedSplits = {
  group: bigint;
  splits: JBSplit[];
};

export type JBFundAccessConstraints = {
  terminal: `0x${string}`;
  token: `0x${string}`;
  distributionLimit: bigint;
  distributionLimitCurrency: bigint;
  overflowAllowance: bigint;
  overflowAllowanceCurrency: bigint;
};

export type JBReconfigureFundingCycleData = {
  projectId: bigint;
  data: JBFundingCycleData;
  metadata: JBFundingCycleMetadata;
  mustStartOnOrAfter: bigint;
  groupedSplits: JBGroupedSplits[];
  fundAccessConstraints: JBFundAccessConstraints[];
  memo: string;
};

// =============================================================================
// ======================= Payment Terminal Types ==============================
// =============================================================================

export type JBDistributePayoutsOfData = {
  projectId: bigint;
  amount: bigint;
  currency: bigint;
  token: `0x${string}`;
  minReturnedTokens: bigint;
  metadata: `0x${string}`;
};
