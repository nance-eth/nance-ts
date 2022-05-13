export interface Proposal {
  hash: string,
  title: string,
  url: string,
  category?: string | undefined,
  status?: string,
  proposalId?: string
  author?: string,
  discussionThreadURL: string,
  ipfsURL?: string,
  snapshotURL?: string,
}

export interface DateEvent {
  event: string
  start: Date,
  end: Date,
}

export interface Organization {
  configURL: string,
  calendarURL: string
}

export type Organizations = [];
