import { oneLine } from 'common-tags';
import { Proposal } from '../types';
import { getLastSlash } from '../utils';

// mappings from notion property keys to sql columns
export const keyMappings = {
  hash: 'uuid',
  title: 'title',
  body: 'body',
  discussionThreadURL: 'discussionURL',
  governanceCycle: 'governanceCycle',
  date: 'createdTime',
  type: 'category',
  status: 'proposalStatus',
  proposalId: 'proposalId',
  author: 'authorAddress',
  voteURL: 'snapshotId',
  version: 'treasuryVersion',
  voteResults: 'snapshotVotes'
};

export const allKeys = oneLine`(
  uuid, createdTime, lastEditedTime, title, body, authorAddress, authorDiscordId, category, proposalStatus,
  proposalId, temperatureCheckVotes, snapshotId, voteType, choices, snapshotVotes, governanceCycle, discussionURL
)`;
