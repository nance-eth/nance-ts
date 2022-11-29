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

// form sql queries such that they can used with INSERT INTO ... ON DUPLICATE KEY UPDATE
export const sqlQueryValues = (proposals: Proposal[], keysToUpdate: (keyof Proposal)[]) => {
  const dDate = new Date().toISOString();
  const dString = 'dummy';
  const dStringAddress = '0'.repeat(42);
  const dStringDiscordId = '0'.repeat(18);
  const dNumber = 0;
  const dJSON: string[] = [];
  keysToUpdate.unshift('hash'); // always include hash aka uuid at beginning of keysToUpdate

  const query: string[] = [];
  proposals.forEach((proposal) => {
    const p: Partial<Proposal> = Object.fromEntries(keysToUpdate.filter((key) => { return key in proposal; }).map((key) => {
      return [key, proposal[key]];
    }));
    query.push(oneLine`(
      '${p.hash}',
      '${dDate}',
      '${dDate}',
      '${p.title ?? dString}',
      '${p.body ?? dString}',
      '${p.authorAddress ?? dStringAddress}',
      '${p.authorDiscordId ?? dStringDiscordId}',
      '${p.type ?? dString}',
      '${p.status ?? dString}',
      ${Number(p.proposalId?.split('JBP-')[1] ?? dNumber)},
      '[${p.temperatureCheckVotes || dJSON}]',
      '${getLastSlash(p.voteURL ?? '') || dString}',
      '${p.voteSetup?.type || dString}',
      '[${Object.values(p.voteSetup?.choices ?? '') || dJSON}]',
      '[${Object.values(p.voteResults?.scores ?? '') || dJSON}]',
      ${p.governanceCycle ?? dNumber},
      '${p.discussionThreadURL ?? dString}'
    )`);
  });
  const values = (keysToUpdate.map((key) => {
    return `${keyMappings[key as keyof typeof keyMappings]} = VALUES(${keyMappings[key as keyof typeof keyMappings]})`;
  }).join(', '));
  return {
    query: query.join(', '),
    values
  };
};
