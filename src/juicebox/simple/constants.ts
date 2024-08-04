/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable key-spacing */
import { JBETHPaymentTerminal3_1_2_Address } from "./contracts/JBETHPaymentTerminal3_1_2";
import { JBReconfigureFundingCycleData } from "./types";

export const JB3DayReconfigurationBufferBallot_Address = "0x19D8C293D35EA4b2879A864A68D45a2025694929";
export const BuyBackDelegate_Address = "0xf4BF4D5a5631d29Bd0B7A33a0a1870bcC4529f03";
export const TOKEN_ETH = "0x000000000000000000000000000000000000EEEe";
export const DISTRIBUTION_CURRENCY_USD = 2n;
export const GROUP_PAYOUTS = 1n;
export const GROUP_RESERVED = 2n;

export const defaultFundingCycleData: JBReconfigureFundingCycleData = {
  projectId: 1n,
  data: {
    duration: 1209600n,
    weight: 1n,
    discountRate: 0n,
    ballot: JB3DayReconfigurationBufferBallot_Address
  },
  metadata: {
    global: {
      allowSetTerminals: true,
      allowSetController: true,
      pauseTransfers: false
    },
    reservedRate:                   5000n,
    redemptionRate:                 7000n,
    ballotRedemptionRate:           7000n,
    pausePay:                       false,
    pauseDistributions:             false,
    pauseRedeem:                    false,
    pauseBurn:                      false,
    allowMinting:                   false,
    allowTerminalMigration:         true,
    allowControllerMigration:       true,
    holdFees:                       false,
    preferClaimedTokenOverride:     false,
    useTotalOverflowForRedemptions: false,
    useDataSourceForPay:            true,
    useDataSourceForRedeem:         false,
    dataSource:                     "0xf4BF4D5a5631d29Bd0B7A33a0a1870bcC4529f03",
    metadata:                       0n
  },
  mustStartOnOrAfter:               1n,
  groupedSplits:                    [{ group: GROUP_PAYOUTS, splits: [] }, { group: GROUP_RESERVED, splits: [] }],
  fundAccessConstraints: [{
    terminal:                       JBETHPaymentTerminal3_1_2_Address,
    token:                          TOKEN_ETH,
    distributionLimit:              0n,
    distributionLimitCurrency:      DISTRIBUTION_CURRENCY_USD,
    overflowAllowance:              0n,
    overflowAllowanceCurrency:      0n
  }],
  memo: ""
};
