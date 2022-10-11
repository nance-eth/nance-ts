import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

import {
  TicketModStruct,
  PayoutModStruct,
  FundingCycleMetadataStruct,
  FundingCyclePropertiesStruct
} from 'juice-sdk-v1/dist/cjs/types/contracts/TerminalV1';

import {
  FundingCycleStructOutput
} from 'juice-sdk-v1/dist/cjs/types/contracts/FundingCycles';

const DISTRIBUTION_PAYOUT_SCALAR = 18;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type ReconfigurationBallotAddresses = {
  0: string,
  3: string,
  7: string
};

export type BallotKey = keyof ReconfigurationBallotAddresses;

type JBNetworks = 'rinkeby' | 'mainnet';

export const reconfigurationBallotAddresses: Record<JBNetworks, ReconfigurationBallotAddresses> = {
  rinkeby: {
    0: ZERO_ADDRESS,
    3: '0xC3890c4Dac5D06C4DAA2eE3Fdc95eC1686A4718e',
    7: '0x69f9aAC8e68cBa3685b84A1990a0F29F131Ca791'
  },
  mainnet: {
    0: ZERO_ADDRESS,
    3: '0x6d6da471703647Fd8b84FFB1A29e037686dBd8b2',
    7: '0xEf7480b6E7CEd228fFB0854fe49A428F562a8982'
  },
};

export type ConfigureFundingCyclesOfData = [
  BigNumberish, // projectId
  FundingCyclePropertiesStruct, // properties
  FundingCycleMetadataStruct, // metadata
  PayoutModStruct[], // payouts
  TicketModStruct[], // tickets aka reserved distributions
];

export type PayoutAndTickets = {
  payoutMods: PayoutModStruct[],
  ticketMods: TicketModStruct[]
};

export const getFundingCyclePropertiesStruct = (
  data: FundingCycleStructOutput,
  distributionLimit: number,
  distributionLimitCurrency: number,
  ballot: string
): FundingCyclePropertiesStruct => {
  return {
    target: BigNumber.from(distributionLimit).mul(BigNumber.from(10).pow(DISTRIBUTION_PAYOUT_SCALAR)),
    currency: distributionLimitCurrency,
    duration: data.duration,
    cycleLimit: 0,
    discountRate: data.discountRate,
    ballot
  };
};

// packed `metadata` format: 0btTPRRRRRRRRBBBBBBBBrrrrrrrrVVVVVVVV
// V: version (bits 0-7)
// r: reserved (bits 8-15)
// B: bondingCurveRate (bits 16-23)
// R: reconfigurationBondingCurveRate (bits 24-31)
// P: payIsPaused (bit 32)
// T: ticketPrintingIsAllowed (bits 33)
// t: treasuryExtension (bits 34-194)

const bits8 = 0b11111111;
const bits1 = 0b1;

export const getFundingCycleMetadataStruct = (
  metadata: BigNumber,
): FundingCycleMetadataStruct => {
  const version = metadata
    .and(bits8)
    .toNumber();

  return {
    version,
    reservedRate: metadata.shr(8).and(bits8).toNumber(),
    bondingCurveRate: metadata.shr(16).and(bits8).toNumber(),
    reconfigurationBondingCurveRate: metadata.shr(24).and(bits8).toNumber(),
    payIsPaused:
      version === 0 ? null : Boolean(metadata.shr(32).and(bits1).toNumber()),
    ticketPrintingIsAllowed:
      version === 0 ? null : Boolean(metadata.shr(33).and(bits1).toNumber()),
    treasuryExtension: version === 0 ? null : metadata.shr(34).toHexString(),
  } as FundingCycleMetadataStruct;
};
