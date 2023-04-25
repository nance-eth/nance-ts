import { JBSplitStruct } from '@jigglyjams/juice-sdk-v3/dist/cjs/types/contracts/JBController';

type ProposalType = 'Payout' | 'ReservedToken' | 'ParameterUpdate' | 'ProcessUpdate' | 'CustomTransaction';

export { JBSplitStruct };
export interface Proposal {
  hash: string;
  title: string;
  body?: string;
  translation?: {
    body?: string;
    language?: string;
  },
  payout?: Payout;
  notification?: Notification;
  reserve?: Reserve;
  url: string;
  governanceCycle?: number;
  date?: string,
  translationURL?: string;
  type?: string;
  status: string;
  proposalId: number | null;
  author?: string;
  discussionThreadURL: string;
  ipfsURL: string;
  voteURL: string;
  voteSetup?: SnapshotVoteOptions;
  internalVoteResults?: InternalVoteResults;
  voteResults?: VoteResults;
  version?: string;
  authorAddress?: string;
  authorDiscordId?: string;
  temperatureCheckVotes?: number[];
  createdTime?: Date;
  lastEditedTime?: Date;
  actions?: Action[];
}

export type Action = {
  type: 'Payout' | 'Reserve' | 'Transfer' | 'Custom Transaction';
  name?: string;
  uuid: string;
  payload: Payout | JBSplitStruct[] | Transfer | CustomTransaction;
};

export type Payout = {
  type?: 'address' | 'project' | 'allocator';
  address?: string;
  project?: number;
  amountUSD: number;
  count: number;
  payName?: string;
  uuid?: string;
};

type Notification = {
  discordUserId: string;
  expiry: boolean;
  execution: boolean;
  progress: boolean;
};

export type Reserve = {
  address: string;
  percentage: number;
};

export type Transfer = {
  contract: string;
  tokenName: string;
  to: string;
  amount: string;
};

export type CustomTransaction = {
  contract: string;
  value: string;
  functionName: string;
  args: any;
};

export type ParameterUpdate = {
  durationDays: number;
  discountPercentage: number;
  reservedPercentage: number;
  redemptionPercentage: number;
};

export type InternalVoteResults = {
  voteProposalId: string;
  totalVotes: number;
  scoresState: string;
  scores: Record<string, number>;
  percentages: Record<string, number>;
  outcomePercentage: string;
  outcomeEmoji: string;
};

export type VoteResults = {
  choices: string[];
  scores: number[];
  votes: number;
};

export type BasicTransaction = {
  address: string;
  bytes: string;
};

export type ProposalNoHash = Omit<Proposal, 'hash'>;

export type ProposalStore = Record<string, ProposalNoHash>;

export type PropertyKeys = {
  proposalId: string;
  status: string;
  statusTemperatureCheck: string;
  statusVoting: string;
  statusApproved: string;
  statusCancelled: string;
  proposalIdPrefix: string;
  discussionThread: string;
  ipfs: string;
  vote: string;
  type: string;
  typeRecurringPayout: string;
  typePayout: string;
  governanceCycle: string;
  governanceCyclePrefix: string;
  reservePercentage: string;
  payoutName: string;
  payoutType: string;
  payoutAmountUSD: string;
  payoutAddress: string;
  payoutCount: string;
  payName: string;
  treasuryVersion: string;
  payoutFirstFC: string;
  payoutLastFC: string;
  payoutRenewalFC: string;
  payoutProposalLink: string;
  publicURLPrefix: string;
};

export interface NanceConfig {
  name: string;
  juicebox: {
    network: 'mainnet' | 'rinkeby';
    projectId: string;
    gnosisSafeAddress: string;
  };
  discord: {
    API_KEY: string;
    guildId: string;
    roles: {
      governance: string;
    };
    channelIds: {
      proposals: string;
      bookkeeping: string;
      transactions: string;
    }
    poll: {
      voteYesEmoji: string;
      voteNoEmoji: string;
      voteGoVoteEmoji: string;
      votePassEmoji: string;
      voteCancelledEmoji: string;
      minYesVotes: number;
      yesNoRatio: number;
      showResults: boolean;
    };
    reminder: {
      channelIds: string[];
      imagesCID: string;
      imageNames: string[];
      links: Record<string, string>;
    };
  };
  propertyKeys: PropertyKeys;
  notion: {
    API_KEY: string;
    enabled: boolean;
    database_id: string;
    current_cycle_block_id: string;
    payouts_database_id: string;
    reserves_database_id: string;
  };
  dolt: DoltConfig,
  snapshot: {
    base: string;
    space: string;
    choices: string[];
    minTokenPassingAmount: number;
    passingRatio: number;
  };
  calendarCID?: string;
}

export type DoltConfig = {
  enabled: boolean;
  owner: string;
  repo: string;
};

export interface DateEvent {
  title: string;
  start: Date;
  end: Date;
}

export interface PollResults {
  voteYesUsers: string[];
  voteNoUsers: string[];
}

export interface PollEmojis {
  voteYesEmoji: string;
  voteNoEmoji: string;
}

export type SnapshotVoteOptions = {
  type?: string,
  choices?: string[]
};

export interface Signature {
  address: string;
  signature: string;
  timestamp: number;
}

export type Network = 'mainnet' | 'goerli';

export type PartialTransaction = {
  to: string;
  value: string;
  data: string;
  operation?: number;
};
