import { TargetLanguageCode } from 'deepl-node';

type ProposalType = 'Payout' | 'ReservedToken' | 'ParameterUpdate' | 'ProcessUpdate' | 'CustomTransaction';

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
  proposalId: string;
  author?: string;
  discussionThreadURL: string;
  ipfsURL: string;
  voteURL: string;
  voteSetup?: SnapshotVoteOptions;
  voteResults?: VoteResults;
  version?: string;
  authorAddress?: string;
  authorDiscordId?: string;
  temperatureCheckVotes?: number[];
  createdTime?: Date;
  lastEditedTime?: Date;
}

export type Payout = {
  type?: 'address' | 'project';
  address: string;
  project?: number;
  amountUSD: number;
  count: number;
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

export type ParameterUpdate = {
  durationDays: number;
  discountPercentage: number;
  reservedPercentage: number;
  redemptionPercentage: number;
};

export type VoteResults = {
  voteProposalId: string;
  totalVotes: number;
  scoresState: string;
  scores: Record<string, number>;
  percentages: Record<string, number>;
  outcomePercentage: string;
  outcomeEmoji: string;
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
  treasuryVersion: string;
  payoutFirstFC: string;
  payoutLastFC: string;
  payoutRenewalFC: string;
  payoutProposalLink: string;
};

export interface NanceConfig {
  name: string;
  proposalDataBackup: string;
  ipfsGateway: string;
  votingResultsDashboard: string;
  translation?: {
    api: string;
    targetLanguage: TargetLanguageCode;
    storage: {
      user: string;
      repo: string;
    }
  };
  juicebox: {
    network: 'mainnet' | 'rinkeby';
    projectId: string;
    gnosisSafeAddress: string;
  };
  reminder: {
    channelIds: string[];
    imagesCID: string;
    images: string[];
    links: Record<string, string>;
  }
  discord: {
    API_KEY: string;
    guildId: string;
    channelId: string;
    alertRole: string;
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
  };
  propertyKeys: PropertyKeys;
  notion: {
    API_KEY: string;
    publicURLPrefix: string;
    database_id: string;
    current_cycle_block_id: string;
    payouts_database_id: string;
    reserves_database_id: string;
  };
  github: {
    user: string;
    repo: string;
    propertyKeys: {
      title: string;
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
      governanceCycle: string;
    },
  },
  dolt: DoltConfig,
  snapshot: {
    base: string;
    space: string;
    choices: string[];
    minTokenPassingAmount: number;
    passingRatio: number;
  };
}

export type DoltConfig = {
  API_KEY: string;
  owner: string;
  repo: string;
};

export interface DateEvent {
  title: string;
  start: Date;
  end: Date;
  inProgress: boolean;
}

export interface PollResults {
  voteYesUsers: string[];
  voteNoUsers: string[];
}

export interface PollEmojis {
  voteYesEmoji: string;
  voteNoEmoji: string;
}

export interface PinataKey {
  KEY: string;
  SECRET: string;
}

export interface GithubFileChange {
  path: string,
  contents: string
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
