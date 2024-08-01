/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/naming-convention */
export const JBETHPaymentTerminal3_1_2_Address = "0x1d9619E10086FdC1065B114298384aAe3F680CC0";
export const JBETHPaymentTerminal3_1_2_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_baseWeightCurrency",
        type: "uint256"
      },
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
        internalType: "contract IJBSplitsStore",
        name: "_splitsStore",
        type: "address"
      },
      {
        internalType: "contract IJBPrices",
        name: "_prices",
        type: "address"
      },
      {
        internalType: "address",
        name: "_store",
        type: "address"
      },
      {
        internalType: "address",
        name: "_owner",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "FEE_TOO_HIGH",
    type: "error"
  },
  {
    inputs: [],
    name: "INADEQUATE_DISTRIBUTION_AMOUNT",
    type: "error"
  },
  {
    inputs: [],
    name: "INADEQUATE_RECLAIM_AMOUNT",
    type: "error"
  },
  {
    inputs: [],
    name: "INADEQUATE_TOKEN_COUNT",
    type: "error"
  },
  {
    inputs: [],
    name: "NO_MSG_VALUE_ALLOWED",
    type: "error"
  },
  {
    inputs: [],
    name: "PAY_TO_ZERO_ADDRESS",
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
    name: "PROJECT_TERMINAL_MISMATCH",
    type: "error"
  },
  {
    inputs: [],
    name: "REDEEM_TO_ZERO_ADDRESS",
    type: "error"
  },
  {
    inputs: [],
    name: "TERMINAL_TOKENS_INCOMPATIBLE",
    type: "error"
  },
  {
    inputs: [],
    name: "UNAUTHORIZED",
    type: "error"
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
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "refundedFees",
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
        internalType: "bytes",
        name: "metadata",
        type: "bytes"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "AddToBalance",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IJBPayDelegate3_1_1",
        name: "delegate",
        type: "address"
      },
      {
        components: [
          {
            internalType: "address",
            name: "payer",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "projectId",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "currentFundingCycleConfiguration",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "decimals",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "currency",
                type: "uint256"
              }
            ],
            internalType: "struct JBTokenAmount",
            name: "amount",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "decimals",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "currency",
                type: "uint256"
              }
            ],
            internalType: "struct JBTokenAmount",
            name: "forwardedAmount",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "projectTokenCount",
            type: "uint256"
          },
          {
            internalType: "address",
            name: "beneficiary",
            type: "address"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokens",
            type: "bool"
          },
          {
            internalType: "string",
            name: "memo",
            type: "string"
          },
          {
            internalType: "bytes",
            name: "dataSourceMetadata",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "payerMetadata",
            type: "bytes"
          }
        ],
        indexed: false,
        internalType: "struct JBDidPayData3_1_1",
        name: "data",
        type: "tuple"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delegatedAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "DelegateDidPay",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IJBPayDelegate",
        name: "delegate",
        type: "address"
      },
      {
        components: [
          {
            internalType: "address",
            name: "payer",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "projectId",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "currentFundingCycleConfiguration",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "decimals",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "currency",
                type: "uint256"
              }
            ],
            internalType: "struct JBTokenAmount",
            name: "amount",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "decimals",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "currency",
                type: "uint256"
              }
            ],
            internalType: "struct JBTokenAmount",
            name: "forwardedAmount",
            type: "tuple"
          },
          {
            internalType: "uint256",
            name: "projectTokenCount",
            type: "uint256"
          },
          {
            internalType: "address",
            name: "beneficiary",
            type: "address"
          },
          {
            internalType: "bool",
            name: "preferClaimedTokens",
            type: "bool"
          },
          {
            internalType: "string",
            name: "memo",
            type: "string"
          },
          {
            internalType: "bytes",
            name: "metadata",
            type: "bytes"
          }
        ],
        indexed: false,
        internalType: "struct JBDidPayData",
        name: "data",
        type: "tuple"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delegatedAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "DelegateDidPay",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IJBRedemptionDelegate3_1_1",
        name: "delegate",
        type: "address"
      },
      {
        components: [
          {
            internalType: "address",
            name: "holder",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "projectId",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "currentFundingCycleConfiguration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "projectTokenCount",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "decimals",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "currency",
                type: "uint256"
              }
            ],
            internalType: "struct JBTokenAmount",
            name: "reclaimedAmount",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "decimals",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "currency",
                type: "uint256"
              }
            ],
            internalType: "struct JBTokenAmount",
            name: "forwardedAmount",
            type: "tuple"
          },
          {
            internalType: "address payable",
            name: "beneficiary",
            type: "address"
          },
          {
            internalType: "string",
            name: "memo",
            type: "string"
          },
          {
            internalType: "bytes",
            name: "dataSourceMetadata",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "redeemerMetadata",
            type: "bytes"
          }
        ],
        indexed: false,
        internalType: "struct JBDidRedeemData3_1_1",
        name: "data",
        type: "tuple"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delegatedAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "DelegateDidRedeem",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IJBRedemptionDelegate",
        name: "delegate",
        type: "address"
      },
      {
        components: [
          {
            internalType: "address",
            name: "holder",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "projectId",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "currentFundingCycleConfiguration",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "projectTokenCount",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "decimals",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "currency",
                type: "uint256"
              }
            ],
            internalType: "struct JBTokenAmount",
            name: "reclaimedAmount",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "decimals",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "currency",
                type: "uint256"
              }
            ],
            internalType: "struct JBTokenAmount",
            name: "forwardedAmount",
            type: "tuple"
          },
          {
            internalType: "address payable",
            name: "beneficiary",
            type: "address"
          },
          {
            internalType: "string",
            name: "memo",
            type: "string"
          },
          {
            internalType: "bytes",
            name: "metadata",
            type: "bytes"
          }
        ],
        indexed: false,
        internalType: "struct JBDidRedeemData",
        name: "data",
        type: "tuple"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "delegatedAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "DelegateDidRedeem",
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
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "distributedAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "beneficiaryDistributionAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "metadata",
        type: "bytes"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "DistributePayouts",
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
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "netAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "DistributeToPayoutSplit",
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
        name: "feeProjectId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "reason",
        type: "bytes"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "FeeReverted",
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
        name: "amount",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "fee",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "feeDiscount",
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
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "HoldFee",
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
        internalType: "contract IJBPaymentTerminal",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
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
        name: "previousOwner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "OwnershipTransferred",
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
        name: "payer",
        type: "address"
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
        name: "amount",
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
        internalType: "bytes",
        name: "metadata",
        type: "bytes"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "Pay",
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
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "reason",
        type: "bytes"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "PayoutReverted",
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
        name: "amount",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "bool",
        name: "wasHeld",
        type: "bool"
      },
      {
        indexed: false,
        internalType: "address",
        name: "beneficiary",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "ProcessFee",
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
        name: "holder",
        type: "address"
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
        name: "reclaimedAmount",
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
        internalType: "bytes",
        name: "metadata",
        type: "bytes"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "RedeemTokens",
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
        name: "amount",
        type: "uint256"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "refundedFees",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "leftoverAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "RefundHeldFees",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "SetFee",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "feeGauge",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "SetFeeGauge",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "addrs",
        type: "address"
      },
      {
        indexed: true,
        internalType: "bool",
        name: "flag",
        type: "bool"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "SetFeelessAddress",
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
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "distributedAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "netDistributedamount",
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
        internalType: "bytes",
        name: "metadata",
        type: "bytes"
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address"
      }
    ],
    name: "UseAllowance",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      }
    ],
    name: "acceptsToken",
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
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "_token",
        type: "address"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_metadata",
        type: "bytes"
      }
    ],
    name: "addToBalanceOf",
    outputs: [],
    stateMutability: "payable",
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
        name: "_amount",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "_token",
        type: "address"
      },
      {
        internalType: "bool",
        name: "_shouldRefundHeldFees",
        type: "bool"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_metadata",
        type: "bytes"
      }
    ],
    name: "addToBalanceOf",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "baseWeightCurrency",
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
    name: "currency",
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
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address"
      }
    ],
    name: "currencyForToken",
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
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      }
    ],
    name: "currentEthOverflowOf",
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
    name: "decimals",
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
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address"
      }
    ],
    name: "decimalsForToken",
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
        internalType: "uint256",
        name: "_amount",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_currency",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "_token",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_minReturnedTokens",
        type: "uint256"
      },
      {
        internalType: "bytes",
        name: "_metadata",
        type: "bytes"
      }
    ],
    name: "distributePayoutsOf",
    outputs: [
      {
        internalType: "uint256",
        name: "netLeftoverDistributionAmount",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "fee",
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
    name: "feeGauge",
    outputs: [
      {
        internalType: "address",
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
    name: "heldFeesOf",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256"
          },
          {
            internalType: "uint32",
            name: "fee",
            type: "uint32"
          },
          {
            internalType: "uint32",
            name: "feeDiscount",
            type: "uint32"
          },
          {
            internalType: "address",
            name: "beneficiary",
            type: "address"
          }
        ],
        internalType: "struct JBFee[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "isFeelessAddress",
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
    inputs: [
      {
        internalType: "uint256",
        name: "_projectId",
        type: "uint256"
      },
      {
        internalType: "contract IJBPaymentTerminal",
        name: "_to",
        type: "address"
      }
    ],
    name: "migrate",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
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
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
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
        name: "_amount",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "_token",
        type: "address"
      },
      {
        internalType: "address",
        name: "_beneficiary",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_minReturnedTokens",
        type: "uint256"
      },
      {
        internalType: "bool",
        name: "_preferClaimedTokens",
        type: "bool"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_metadata",
        type: "bytes"
      }
    ],
    name: "pay",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "payoutSplitsGroup",
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
    name: "prices",
    outputs: [
      {
        internalType: "contract IJBPrices",
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
    name: "processFees",
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
        internalType: "address",
        name: "_token",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_minReturnedTokens",
        type: "uint256"
      },
      {
        internalType: "address payable",
        name: "_beneficiary",
        type: "address"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_metadata",
        type: "bytes"
      }
    ],
    name: "redeemTokensOf",
    outputs: [
      {
        internalType: "uint256",
        name: "reclaimAmount",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_fee",
        type: "uint256"
      }
    ],
    name: "setFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_feeGauge",
        type: "address"
      }
    ],
    name: "setFeeGauge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address"
      },
      {
        internalType: "bool",
        name: "_flag",
        type: "bool"
      }
    ],
    name: "setFeelessAddress",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [],
    name: "store",
    outputs: [
      {
        internalType: "address",
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
    name: "token",
    outputs: [
      {
        internalType: "address",
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
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "transferOwnership",
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
        name: "_amount",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "_currency",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "_token",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_minReturnedTokens",
        type: "uint256"
      },
      {
        internalType: "address payable",
        name: "_beneficiary",
        type: "address"
      },
      {
        internalType: "string",
        name: "_memo",
        type: "string"
      },
      {
        internalType: "bytes",
        name: "_metadata",
        type: "bytes"
      }
    ],
    name: "useAllowanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "netDistributedAmount",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
