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
  governanceCycle: number;
  discussionURL?: string;
};

export type Payouts = {
  uuid: string;
  uuidOfProposal: string;
  treasuryVersion: number;
  governanceCycleStart: number;
  numberOfPayouts: number;
  lockedUntil: number;
  amount: number;
  currency: number;
  payName?: string;
  payAddress?: string,
  payProject?: number;
  payStatus?: string;
};

export type GovernanceCycles = {
  cycleNumber: number;
  cycleStatus: string;
  startDatetime: Date;
  endDatetime: Date;
  jbV1FundingCycle?: number,
  jbV2FundingCycle?: number;
  jbV3FundingCycle?: number;
};
