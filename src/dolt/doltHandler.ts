import { oneLine } from 'common-tags';
import { Proposal } from '../types';
import { Dolt } from './dolt';
import { uuid } from '../utils';

const proposalsTable = 'proposals';

export class DoltHandler {
  dolt;
  constructor(
    owner: string,
    repo: string,
    DOLT_KEY: string
  ) {
    this.dolt = new Dolt(owner, repo, DOLT_KEY);
  }

  addProposalToDb(proposal: any) {
    const now = new Date().toISOString();
    const query = oneLine`
      INSERT IGNORE INTO ${proposalsTable}
      (uuid, createdTime, lastEditedTime, title, body, category, governanceCycle, proposalStatus, voteType, choices)
      VALUES(
      '${uuid()}',
      '${now}',
      '${now}',
      '${proposal.title}',
      '${proposal.body}',
      '${proposal.type}',
      '${proposal.governanceCycle}',
      '${proposal.status}',
      'basic',
      '["For", "Against", "Abstain"]'
    )`;
    return this.dolt.write(`GC${proposal.governanceCycle}`, query);
  }

  updateStatus(proposal: any, status: string) {
    const now = new Date().toISOString();
    const query = oneLine`
      UPDATE ${proposalsTable} SET
      proposalStatus = '${status}',
      lastEditedTime = '${now}'
      WHERE uuid = '${proposal.hash}'
    `;
    return this.dolt.write(proposal.governanceCycle?.toString() ?? '', query);
  }

  getToDiscuss() {
    return this.dolt.query(`
      SELECT * FROM proposals WHERE
      proposalStatus = 'Discussion
      AND
      discussionURL = NULL
    `);
  }
}
