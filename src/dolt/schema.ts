import { NanceConfig, JBSplitStruct, Action } from '../types';

export type SQLProposal = {
  uuid: string;
  createdTime: Date;
  lastEditedTime: Date;
  title: string;
  body: string;
  authorAddress: string;
  authorDiscordId?: string;
  category: string;
  proposalStatus: string;
  proposalId?: number;
  temperatureCheckVotes: number[];
  snapshotId?: string;
  voteType: string;
  choices: string[];
  snapshotVotes: number[];
  voteAddressCount: number;
  governanceCycle: number;
  discussionURL?: string;
  actions: string;
};

export type SQLPayout = {
  uuidOfPayout: string;
  uuidOfProposal: string;
  treasuryVersion: number;
  governanceCycleStart: number;
  numberOfPayouts: number;
  lockedUntil: number;
  amount: number;
  currency: string;
  payName?: string;
  payAddress?: string,
  payProject?: number;
  payStatus?: string;
  payAllocator?: string;
  authorDiscordId?: string;
  proposalId?: number;
  snapshotId?: string;
};

export type SQLReserve = {
  id: number;
  uuidOfReserve: string;
  uuidOfProposal: string;
  reserveGovernanceCycle: number;
  splits: JBSplitStruct[];
  reserveStatus: string;
};

export type SQLExtended = SQLProposal & SQLPayout & SQLTransfer & SQLReserve & SQLCustomTransaction;

export type GovernanceCycle = {
  cycleNumber: number;
  startDatetime: Date;
  endDatetime: Date;
  jbV1FundingCycle?: number,
  jbV2FundingCycle?: number;
  jbV3FundingCycle?: number;
  acceptingProposals: boolean;
};

export type SpaceConfig = {
  space: string,
  spaceOwners: string[],
  cid: string;
  config: NanceConfig;
  calendar: string;
  lastUpdated: Date;
};

export type SQLTransfer = {
  uuidOfTransfer: string;
  uuidOfProposal: string;
  transferGovernanceCycle: number;
  transferCount: number;
  transferName: string;
  transferAddress: string;
  transferTokenName: string;
  transferTokenAddress: string;
  transferAmount: string;
  transferDecimals: number;
  transferStatus: string;
};

export type SQLCustomTransaction = {
  uuidOfTransaction: string;
  uuidOfProposal: string;
  transactionGovernanceCycle: number;
  transactionCount: number;
  transactionName: string;
  transactionAddress: string;
  transactionValue: string;
  transactionFunctionName: string;
  transactionFunctionArgs: string;
  transactionStatus: string;
};
