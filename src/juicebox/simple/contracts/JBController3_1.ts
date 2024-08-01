/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/naming-convention */
export const JBController3_1_Address = "0x97a5b9D9F0F7cD676B69f584F29048D0Ef4BB59b";
export const JBController3_1_ABI = [
  {
    inputs: [
      {
        internalType: "contract IJBOperatorStore",
        name: "_operatorStore",
        type: "address"
      },
      {
        internalType: "contract IJBProjects",
        name: "_projects",
        type: "address"
      },
      {
        internalType: "contract IJBDirectory",
        name: "_directory",
        type: "address"
      },
      {
        internalType: "contract IJBFundingCycleStore",
        name: "_fundingCycleStore",
        type: "address"
      },
      {
        internalType: "contract IJBTokenStore",
        name: "_tokenStore",
        type: "address"
      },
      {
        internalType: "contract IJBSplitsStore",
        name: "_splitsStore",
        type: "address"
      },
      {
        internalType: "contract IJBFundAccessConstraintsStore",
        name: "_fundAccessConstraintsStore",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "BURN_PAUSED_AND_SENDER_NOT_VALID_TERMINAL_DELEGATE",
    type: "error"
  },
  {
    inputs: [],
    name: "CANT_MIGRATE_TO_CURRENT_CONTROLLER",
    type: "error"
  },
  {
    inputs: [],
    name: "FUNDING_CYCLE_ALREADY_LAUNCHED",
    type: "error"
  },
  {
    inputs: [],
    name: "INVALID_BALLOT_REDEMPTION_RATE",
    type: "error"
  },
  {
    inputs: [],
    name: "INVALID_REDEMPTION_RATE",
    type: "error"
  },
  {
    inputs: [],
    name: "INVALID_RESERVED_RATE",
    type: "error"
  },
  {
    inputs: [],
    name: "MIGRATION_NOT_ALLOWED",
    type: "error"
  },
  {
    inputs: [],
    name: "MINT_NOT_ALLOWED_AND_NOT_TERMINAL_DELEGATE",
    type: "error"
  },
  {
    inputs: [],
    name: "NOT_CURRENT_CONTROLLER",
    type: "error"
  },
  {
    inputs: [],
    name: "NO_BURNABLE_TOKENS",
    type: "error"
  },
  {
    inputs: [],
    name: "OVERFLOW_ALERT",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "prod1",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "denominator",
        type: "uint256"
      }
    ],
    name: "PRBMath__MulDivOverflow",
    type: "error"
  },
  {
    inputs: [],
    name: "UNAUTHORIZED",
    type: "error"
  },
  {
    inputs: [],
    name: "ZERO_TOKENS_TO_MINT",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "holder",
        type: "address"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenCount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "memo",
        type: "string"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "BurnTokens",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "fundingCycleConfiguration",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "fundingCycleNumber",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "beneficiary",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenCount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beneficiaryTokenCount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "memo",
        type: "string"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "DistributeReservedTokens",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "domain",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "group",
        type: "uint256"
      },
      {
        components: [
          {
            internalType: "bool",
            name: "preferClaimed",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "preferAddToBalance",
            type: "bool"
          },
          {
            internalType: "uint256",
            name: "percent",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "projectId",
            type: "uint256"
          },
          {
            internalType: "address payable",
            name: "beneficiary",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "lockedUntil",
            type: "uint256"
          },
          {
            internalType: "contract IJBSplitAllocator",
            name: "allocator",
            type: "address"
          }
        ],
        indexed: false,
        internalType: "struct JBSplit",
        name: "split",
        type: "tuple"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenCount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "DistributeToReservedTokenSplit",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "configuration",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "memo",
        type: "string"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "LaunchFundingCycles",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "configuration",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "memo",
        type: "string"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "LaunchProject",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "contract IJBMigratable",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "Migrate",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beneficiary",
        type: "address"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenCount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beneficiaryTokenCount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "memo",
        type: "string"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "reservedRate",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "MintTokens",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "PrepMigration",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "configuration",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "string",
        name: "memo",
        type: "string"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "ReconfigureFundingCycles",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_holder",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_tokenCount",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      },
      {
        internalType: "bool",
        name: "_preferClaimedTokens",
        type: "bool"
      }
    ],
    name: "burnTokensOf",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      }
    ],
    name: "currentFundingCycleOf",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "number",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "configuration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "basedOn",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "discountRate",
            type: "uint256"
          },
          {
            internalType: "contract IJBFundingCycleBallot",
            name: "ballot",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycle",
        name: "fundingCycle",
        type: "tuple"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bool",
                name: "allowSetTerminals",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "allowSetController",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "pauseTransfers",
                type: "bool"
              }
            ],
            internalType: "struct JBGlobalFundingCycleMetadata",
            name: "global",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "reservedRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "redemptionRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "ballotRedemptionRate",
            type: "uint256"
          },
          {
            internalType: "bool",
            name: "pausePay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseDistributions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseRedeem",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseBurn",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowMinting",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowTerminalMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowControllerMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "holdFees",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokenOverride",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useTotalOverflowForRedemptions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForPay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForRedeem",
            type: "bool"
          },
          {
            internalType: "address",
            name: "dataSource",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycleMetadata",
        name: "metadata",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "directory",
    outputs: [
      {
        internalType: "contract IJBDirectory",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      }
    ],
    name: "distributeReservedTokensOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "fundAccessConstraintsStore",
    outputs: [
      {
        internalType: "contract IJBFundAccessConstraintsStore",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "fundingCycleStore",
    outputs: [
      {
        internalType: "contract IJBFundingCycleStore",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_configuration",
        type: "uint256"
      }
    ],
    name: "getFundingCycleOf",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "number",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "configuration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "basedOn",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "discountRate",
            type: "uint256"
          },
          {
            internalType: "contract IJBFundingCycleBallot",
            name: "ballot",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycle",
        name: "fundingCycle",
        type: "tuple"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bool",
                name: "allowSetTerminals",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "allowSetController",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "pauseTransfers",
                type: "bool"
              }
            ],
            internalType: "struct JBGlobalFundingCycleMetadata",
            name: "global",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "reservedRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "redemptionRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "ballotRedemptionRate",
            type: "uint256"
          },
          {
            internalType: "bool",
            name: "pausePay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseDistributions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseRedeem",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseBurn",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowMinting",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowTerminalMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowControllerMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "holdFees",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokenOverride",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useTotalOverflowForRedemptions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForPay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForRedeem",
            type: "bool"
          },
          {
            internalType: "address",
            name: "dataSource",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycleMetadata",
        name: "metadata",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      }
    ],
    name: "latestConfiguredFundingCycleOf",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "number",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "configuration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "basedOn",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "discountRate",
            type: "uint256"
          },
          {
            internalType: "contract IJBFundingCycleBallot",
            name: "ballot",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycle",
        name: "fundingCycle",
        type: "tuple"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bool",
                name: "allowSetTerminals",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "allowSetController",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "pauseTransfers",
                type: "bool"
              }
            ],
            internalType: "struct JBGlobalFundingCycleMetadata",
            name: "global",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "reservedRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "redemptionRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "ballotRedemptionRate",
            type: "uint256"
          },
          {
            internalType: "bool",
            name: "pausePay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseDistributions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseRedeem",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseBurn",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowMinting",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowTerminalMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowControllerMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "holdFees",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokenOverride",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useTotalOverflowForRedemptions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForPay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForRedeem",
            type: "bool"
          },
          {
            internalType: "address",
            name: "dataSource",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycleMetadata",
        name: "metadata",
        type: "tuple"
      },
      {
        internalType: "enum JBBallotState",
        name: "ballotState",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "discountRate",
            type: "uint256"
          },
          {
            internalType: "contract IJBFundingCycleBallot",
            name: "ballot",
            type: "address"
          }
        ],
        internalType: "struct JBFundingCycleData",
        name: "_data",
        type: "tuple"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bool",
                name: "allowSetTerminals",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "allowSetController",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "pauseTransfers",
                type: "bool"
              }
            ],
            internalType: "struct JBGlobalFundingCycleMetadata",
            name: "global",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "reservedRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "redemptionRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "ballotRedemptionRate",
            type: "uint256"
          },
          {
            internalType: "bool",
            name: "pausePay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseDistributions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseRedeem",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseBurn",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowMinting",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowTerminalMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowControllerMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "holdFees",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokenOverride",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useTotalOverflowForRedemptions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForPay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForRedeem",
            type: "bool"
          },
          {
            internalType: "address",
            name: "dataSource",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycleMetadata",
        name: "_metadata",
        type: "tuple"
      },
      {
        internalType: "uint256",
        name: "_mustStartAtOrAfter",
        type: "uint256"
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "group",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "bool",
                name: "preferClaimed",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "preferAddToBalance",
                type: "bool"
              },
              {
                internalType: "uint256",
                name: "percent",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "projectId",
                type: "uint256"
              },
              {
                internalType: "address payable",
                name: "beneficiary",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "lockedUntil",
                type: "uint256"
              },
              {
                internalType: "contract IJBSplitAllocator",
                name: "allocator",
                type: "address"
              }
            ],
            internalType: "struct JBSplit[]",
            name: "splits",
            type: "tuple[]"
          }
        ],
        internalType: "struct JBGroupedSplits[]",
        name: "_groupedSplits",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "contract IJBPaymentTerminal",
            name: "terminal",
            type: "address"
          },
          {
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "distributionLimit",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "distributionLimitCurrency",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "overflowAllowance",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "overflowAllowanceCurrency",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundAccessConstraints[]",
        name: "_fundAccessConstraints",
        type: "tuple[]"
      },
      {
        internalType: "contract IJBPaymentTerminal[]",
        name: "_terminals",
        type: "address[]"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      }
    ],
    name: "launchFundingCyclesFor",
    outputs: [
      {
        internalType: "uint256",
        name: "configuration",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address"
      },
      {
        components: [
          {
            internalType: "string",
            name: "content",
            type: "string"
          },
          {
            internalType: "uint256",
            name: "domain",
            type: "uint256"
          }
        ],
        internalType: "struct JBProjectMetadata",
        name: "_projectMetadata",
        type: "tuple"
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "discountRate",
            type: "uint256"
          },
          {
            internalType: "contract IJBFundingCycleBallot",
            name: "ballot",
            type: "address"
          }
        ],
        internalType: "struct JBFundingCycleData",
        name: "_data",
        type: "tuple"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bool",
                name: "allowSetTerminals",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "allowSetController",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "pauseTransfers",
                type: "bool"
              }
            ],
            internalType: "struct JBGlobalFundingCycleMetadata",
            name: "global",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "reservedRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "redemptionRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "ballotRedemptionRate",
            type: "uint256"
          },
          {
            internalType: "bool",
            name: "pausePay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseDistributions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseRedeem",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseBurn",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowMinting",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowTerminalMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowControllerMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "holdFees",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokenOverride",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useTotalOverflowForRedemptions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForPay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForRedeem",
            type: "bool"
          },
          {
            internalType: "address",
            name: "dataSource",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycleMetadata",
        name: "_metadata",
        type: "tuple"
      },
      {
        internalType: "uint256",
        name: "_mustStartAtOrAfter",
        type: "uint256"
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "group",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "bool",
                name: "preferClaimed",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "preferAddToBalance",
                type: "bool"
              },
              {
                internalType: "uint256",
                name: "percent",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "projectId",
                type: "uint256"
              },
              {
                internalType: "address payable",
                name: "beneficiary",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "lockedUntil",
                type: "uint256"
              },
              {
                internalType: "contract IJBSplitAllocator",
                name: "allocator",
                type: "address"
              }
            ],
            internalType: "struct JBSplit[]",
            name: "splits",
            type: "tuple[]"
          }
        ],
        internalType: "struct JBGroupedSplits[]",
        name: "_groupedSplits",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "contract IJBPaymentTerminal",
            name: "terminal",
            type: "address"
          },
          {
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "distributionLimit",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "distributionLimitCurrency",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "overflowAllowance",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "overflowAllowanceCurrency",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundAccessConstraints[]",
        name: "_fundAccessConstraints",
        type: "tuple[]"
      },
      {
        internalType: "contract IJBPaymentTerminal[]",
        name: "_terminals",
        type: "address[]"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      }
    ],
    name: "launchProjectFor",
    outputs: [
      {
        internalType: "uint256",
        name: "projectId",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        internalType: "contract IJBMigratable",
        name: "_to",
        type: "address"
      }
    ],
    name: "migrate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_tokenCount",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "_beneficiary",
        type: "address"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      },
      {
        internalType: "bool",
        name: "_preferClaimedTokens",
        type: "bool"
      },
      {
        internalType: "bool",
        name: "_useReservedRate",
        type: "bool"
      }
    ],
    name: "mintTokensOf",
    outputs: [
      {
        internalType: "uint256",
        name: "beneficiaryTokenCount",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "operatorStore",
    outputs: [
      {
        internalType: "contract IJBOperatorStore",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "_from",
        type: "address"
      }
    ],
    name: "prepForMigrationOf",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "projects",
    outputs: [
      {
        internalType: "contract IJBProjects",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      }
    ],
    name: "queuedFundingCycleOf",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "number",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "configuration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "basedOn",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "discountRate",
            type: "uint256"
          },
          {
            internalType: "contract IJBFundingCycleBallot",
            name: "ballot",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycle",
        name: "fundingCycle",
        type: "tuple"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bool",
                name: "allowSetTerminals",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "allowSetController",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "pauseTransfers",
                type: "bool"
              }
            ],
            internalType: "struct JBGlobalFundingCycleMetadata",
            name: "global",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "reservedRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "redemptionRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "ballotRedemptionRate",
            type: "uint256"
          },
          {
            internalType: "bool",
            name: "pausePay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseDistributions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseRedeem",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseBurn",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowMinting",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowTerminalMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowControllerMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "holdFees",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokenOverride",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useTotalOverflowForRedemptions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForPay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForRedeem",
            type: "bool"
          },
          {
            internalType: "address",
            name: "dataSource",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycleMetadata",
        name: "metadata",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "weight",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "discountRate",
            type: "uint256"
          },
          {
            internalType: "contract IJBFundingCycleBallot",
            name: "ballot",
            type: "address"
          }
        ],
        internalType: "struct JBFundingCycleData",
        name: "_data",
        type: "tuple"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "bool",
                name: "allowSetTerminals",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "allowSetController",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "pauseTransfers",
                type: "bool"
              }
            ],
            internalType: "struct JBGlobalFundingCycleMetadata",
            name: "global",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "reservedRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "redemptionRate",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "ballotRedemptionRate",
            type: "uint256"
          },
          {
            internalType: "bool",
            name: "pausePay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseDistributions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseRedeem",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "pauseBurn",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowMinting",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowTerminalMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "allowControllerMigration",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "holdFees",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokenOverride",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useTotalOverflowForRedemptions",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForPay",
            type: "bool"
          },
          {
            internalType: "bool",
            name: "useDataSourceForRedeem",
            type: "bool"
          },
          {
            internalType: "address",
            name: "dataSource",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "metadata",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundingCycleMetadata",
        name: "_metadata",
        type: "tuple"
      },
      {
        internalType: "uint256",
        name: "_mustStartAtOrAfter",
        type: "uint256"
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "group",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "bool",
                name: "preferClaimed",
                type: "bool"
              },
              {
                internalType: "bool",
                name: "preferAddToBalance",
                type: "bool"
              },
              {
                internalType: "uint256",
                name: "percent",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "projectId",
                type: "uint256"
              },
              {
                internalType: "address payable",
                name: "beneficiary",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "lockedUntil",
                type: "uint256"
              },
              {
                internalType: "contract IJBSplitAllocator",
                name: "allocator",
                type: "address"
              }
            ],
            internalType: "struct JBSplit[]",
            name: "splits",
            type: "tuple[]"
          }
        ],
        internalType: "struct JBGroupedSplits[]",
        name: "_groupedSplits",
        type: "tuple[]"
      },
      {
        components: [
          {
            internalType: "contract IJBPaymentTerminal",
            name: "terminal",
            type: "address"
          },
          {
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "distributionLimit",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "distributionLimitCurrency",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "overflowAllowance",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "overflowAllowanceCurrency",
            type: "uint256"
          }
        ],
        internalType: "struct JBFundAccessConstraints[]",
        name: "_fundAccessConstraints",
        type: "tuple[]"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      }
    ],
    name: "reconfigureFundingCyclesOf",
    outputs: [
      {
        internalType: "uint256",
        name: "configuration",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    name: "reservedTokenBalanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "splitsStore",
    outputs: [
      {
        internalType: "contract IJBSplitsStore",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "_interfaceId",
        type: "bytes4"
      }
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "tokenStore",
    outputs: [
      {
        internalType: "contract IJBTokenStore",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      }
    ],
    name: "totalOutstandingTokensOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;
