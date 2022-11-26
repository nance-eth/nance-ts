import { oneLine } from 'common-tags';
import { Proposal, DoltConfig } from '../types';
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

  async addProposalToDb(proposal: any) {
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

  async updateStatus(proposal: any, status: string) {
    const now = new Date().toISOString();
    const query = oneLine`
      UPDATE ${proposalsTable} SET
      proposalStatus = '${status}',
      lastEditedTime = '${now}'
      WHERE uuid = '${proposal.hash}'
    `;
    return this.dolt.write(proposal.governanceCycle?.toString() ?? undefined, query);
  }

  async queryDb(query: string, governanceCycle: string) {
    return this.dolt.query(query, governanceCycle).then((res) => {
      if (res.query_execution_status === 'Success') return res;
      return Promise.reject(res.query_execution_message);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async getToDiscuss(governanceCycle: string) {
    return this.queryDb(`
      SELECT * FROM proposals WHERE
      proposalStatus = 'Discussion'
      AND
      discussionURL IS NULL
    `, governanceCycle);
  }

  async getDiscussionProposals(governanceCycle: string) {
    return this.dolt.query(`
      SELECT * FROM proposals WHERE
      proposalStatus = 'Discussion'
      AND
      discussionURL IS NOT NULL
      AND title IS NOT NULL
    `, governanceCycle);
  }

  async getTemperatureCheckProposals(governanceCycle: string) {
    return this.queryDb(`
      SELECT * FROM proposals WHERE
      proposalStatus = 'Temperature Check'
    `, governanceCycle);
  }

  async getVoteProposals(governanceCycle: string) {
    return this.queryDb(`
      SELECT * FROM proposals WHERE
      proposalStatus = 'Voting'
    `, governanceCycle);
  }

  async getNextProposalId(governanceCycle: string) {
    return this.queryDb(`
      SELECT proposalId FROM proposals
      ORDER BY proposalId DESC
      LIMIT 1
    `,
    governanceCycle).then((res) => {
      return Number(res.rows[0].proposalId) + 1;
    });
  }
}
