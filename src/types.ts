export interface Proposal {
  hash: string;
  title: string;
  markdown: string;
  url: string;
  category?: string | undefined;
  status?: string;
  proposalId: string
  author?: string;
  discussionThreadURL: string;
  ipfsURL: string;
  voteURL: string;
  voteResults?: VoteResults;
}

export interface VoteResults {
  voteProposalId: string;
  totalVotes: number;
  scoresState: string;
  scores: Record<string, number>;
  percentages: Record<string, number>;
  outcome: boolean;
  outcomePercentage: string;
  outcomeEmoji: string;
}

export interface INance {
  queryAndSendDiscussions(): Promise<void>;
  temperatureCheckSetup(): Promise<void>;
  temperatureCheckClose(): Promise<void>
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
