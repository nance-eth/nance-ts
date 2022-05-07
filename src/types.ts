export interface Proposal {
  hash: string,
  title: string,
  url: string,
  category?: string | undefined,
  status?: string,
  proposalId?: string
  author?: string,
  discussionThreadURL?: string,
  ipfsURL?: string,
  snapshotURL?: string,
}

export interface DateEvent {
  date: Date,
  event: string
}
