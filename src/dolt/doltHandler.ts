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
    return this.dolt.write(query);
  }

  getToDiscuss() {
    return this.dolt.query(`
      SELECT * FROM proposals WHERE
      proposalStatus = 'Discussion'
      AND
      discussionURL = NULL
    `);
  }
}
