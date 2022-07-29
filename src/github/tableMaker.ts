import { oneLine, oneLineTrim, stripIndents } from 'common-tags';
import { numToPrettyString } from '../utils';
import { Proposal } from '../types';

export const heading = [
  'Proposal ID',
  'Title',
  'Status',
  'Governance Cycle',
  'Category',
  'Discussion Thread',
  'Data Backup',
  'Voting',
  'Total Votes',
  'For',
  'Against'
];

export function JSONProposalsToMd(proposals: Proposal[]) {
  const mdHeading = `| ${heading.join(' | ')} |\n|${' :--: |'.repeat(heading.length)}\n`;
  const rows = proposals.reverse().map((p: Proposal) => {
    return ([
      `| _${p.proposalId}_`,
      `[${p.title}](${p.url})`,
      `${p.status}`,
      p.governanceCycle,
      p.category,
      `[Discord](${p.discussionThreadURL})`,
      `[IPFS](${p.ipfsURL})`,
      `[Snapshot](${p.voteURL})`,
      `${p.voteResults?.totalVotes ?? ''}`,
      `${numToPrettyString(p.voteResults?.scores.For) ?? ''}`,
      `${numToPrettyString(p.voteResults?.scores.Against) ?? ''} |`,
    ]).join(' | ');
  }).join('\n');
  return (mdHeading + rows);
}
