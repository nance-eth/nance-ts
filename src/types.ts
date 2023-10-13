import { JBSplitStruct } from '@jigglyjams/juice-sdk-v3/dist/cjs/types/contracts/JBController';

export { JBSplitStruct };
export interface Proposal {
  hash: string;
  title: string;
  body?: string;
  governanceCycle?: number;
  date?: string,
  status: string;
  proposalId: number | null;
  author?: string;
  coauthors?: string[];
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
  actions?: Action[];
}

export type Action = {
  type: 'Payout' | 'Reserve' | 'Transfer' | 'Custom Transaction';
  name?: string;
  uuid: string;
  payload: Payout | Reserve | Transfer | CustomTransaction;
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

export type Reserve = { splits: JBSplitStruct[] };

export type Transfer = {
  contract: string;
  tokenName: string;
  to: string;
  amount: string;
  decimals: number;
};

export type CustomTransaction = {
  contract: string;
  value: string;
  // function approve(address guy, uint256 wad) returns (bool)
  // can pass as ABI
  // can have unnamed parameters
  functionName: string;
  args: any[];
  tenderlyId: string;
};

export type SnapshotProposal = {
  id: string;
  type: string;
  start: string;
  end: string;
  choices: string[];
  state: string;
  votes: number;
  scores: number[];
  scores_total: number;
  scores_state: string;
  title?: string;
  body?: string;
  author?: string;
  discussion?: string;
  ipfs?: string;
};

export type SnapshotVoteResultsId = Pick<SnapshotProposal, 'id' | 'choices' | 'scores' | 'votes' | 'scores_state' | 'scores_total'>;

export type SnapshotVoteSettings = {
  quorum: number;
  period: number;
  type: string;
  delay: number;
};

export type VoteResults = Pick<SnapshotProposal, 'choices' | 'scores' | 'votes' | 'scores_total'> & { quorumMet: boolean };

export type BasicTransaction = {
  address: string;
  bytes: string;
};

export type GovernanceCycleForm = {
  time: FormTime;
  startDate: string;
  temperatureCheckLength: string;
  voteLength: string;
  delayLength: string;
  executionLength: string;
};

export type FormTime = {
  ampm: string;
  hour: number;
  minute: string;
  timezoneOffset: number;
};

export interface NanceConfig {
  name: string;
  juicebox: {
    network: 'mainnet' | 'goerli';
    projectId: string;
    gnosisSafeAddress: string;
    governorAddress: string;
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
      minYesVotes: number;
      yesNoRatio: number;
      verifyRole: string;
    };
    reminder: {
      type: string;
      channelIds: string[];
      imagesCID: string;
      imageNames: string[];
    };
  };
  proposalIdPrefix: string;
  dolt: DoltConfig,
  snapshot: {
    space: string;
    choices: string[];
    minTokenPassingAmount: number;
    passingRatio: number;
  };
  submitAsApproved?: boolean;
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
  unverifiedUsers: string[];
}

export interface PollEmojis {
  voteYesEmoji: string;
  voteNoEmoji: string;
}

export type SnapshotVoteOptions = {
  type: string,
  choices: string[]
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

export type GovernorProposeTransaction = {
  targets: string[];
  values: number[];
  calldatas: string[];
  description: string;
  signatures?: string[];
};
