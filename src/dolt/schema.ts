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
};

export type SQLPayout = {
  uuid: string;
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
  uuid: string;
  uuidOfProposal: string;
  governanceCycleStart: number;
  lockedUntil: number;
  reserveName: string;
  reservePercentage: number;
  reserveAddress: string;
  reserveStatus?: string;
};

export type SQLExtended = SQLProposal & SQLPayout;

export type GovernanceCycle = {
  cycleNumber: number;
  startDatetime: Date;
  endDatetime: Date;
  jbV1FundingCycle?: number,
  jbV2FundingCycle?: number;
  jbV3FundingCycle?: number;
  acceptingProposals: boolean;
};
