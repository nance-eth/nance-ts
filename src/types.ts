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
}

export interface VoteResults {
  voteProposalId: string;
  totalVotes: number;
  scoresState: string;
  votes: Record<string, number>;
}

export interface INance {
  queryAndSendDiscussions(): Promise<void>;
  temperatureCheckSetup(): Promise<void>;
  temperatureCheckClose(): Promise<void>
}

export interface DateEvent {
  event: string;
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

export interface PinataKey {
  KEY: string;
  SECRET: string;
}
