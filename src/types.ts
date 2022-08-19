import { TargetLanguageCode } from 'deepl-node';

export interface Proposal {
  hash: string;
  title: string;
  markdown?: string;
  translation?: {
    markdown?: string,
    language?: string
  },
  url: string;
  governanceCycle?: number;
  date?: string,
  translationURL?: string | undefined;
  category?: string | undefined;
  status: string;
  proposalId: string;
  author?: string;
  discussionThreadURL: string;
  ipfsURL: string;
  voteURL: string;
  voteResults?: VoteResults;
}

export type ProposalNoHash = Omit<Proposal, 'hash'>;

export type ProposalStore = Record<string, ProposalNoHash>;

export interface NanceConfig {
  nameId: string;
  name: string;
  scheme: string[];
  proposalDataBackup: string;
  ipfsGateway: string;
  votingResultsDashboard: string;
  translation: {
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
  };
  discord: {
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
  notion: {
    publicURLPrefix: string;
    database_id: string;
    propertyKeys: {
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
    };
    filters: any;
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
      category: string;
      governanceCycle: string;
    },
  },
  snapshot: {
    base: string;
    space: string;
    choices: string[];
    minTokenPassingAmount: number;
    passingRatio: number;
  };
}

export interface VoteResults {
  voteProposalId: string;
  totalVotes: number;
  scoresState: string;
  scores: Record<string, number>;
  percentages: Record<string, number>;
  outcomePercentage: string;
  outcomeEmoji: string;
}

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
