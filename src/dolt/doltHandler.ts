/* eslint-disable no-param-reassign */
import { oneLine } from 'common-tags';
import { Proposal, PropertyKeys } from '../types';
import { sqlQueryValues, allKeys } from './doltSQL';
import { Dolt } from './dolt';
import { uuid } from '../utils';

const proposalsTable = 'proposals';

export class DoltHandler {
  dolt;
  public currentGovernanceCycle = 0;

  constructor(
    owner: string,
    repo: string,
    DOLT_KEY: string,
    private propertyKeys: PropertyKeys
  ) {
    this.dolt = new Dolt(owner, repo, DOLT_KEY);
    this.propertyKeys = propertyKeys;
  }

  async queryDb(query: string, governanceCycle: number) {
    return this.dolt.query(query, `GC${governanceCycle.toString()}`).then((res) => {
      if (res.query_execution_status === 'Success') return res.rows;
      return Promise.reject(res.query_execution_message);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async writeDb(query: string, governanceCycle: number) {
    return this.dolt.write(query, `GC${governanceCycle.toString()}`).then(async (res) => {
      return this.dolt.poll(res.operation_name).then((poll) => {
        if (poll?.res_details.query_execution_status === 'Success') return 'Success';
        return Promise.reject(poll?.res_details.query_execution_message);
      });
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async addProposalToDb(proposal: any) {
    const now = new Date().toISOString();
    const governanceCycle = (proposal.governanceCycle === 0) ? this.currentGovernanceCycle : proposal.governanceCycle;
    const query = oneLine`
      INSERT IGNORE INTO ${proposalsTable}
      (uuid, createdTime, lastEditedTime, title, body, category, governanceCycle, proposalStatus, voteType, choices, discussionURL)
      VALUES(
      '${proposal.hash || uuid()}',
      '${now}',
      '${now}',
      '${proposal.title}',
      '${proposal.body}',
      '${proposal.type}',
      '${governanceCycle}',
      '${proposal.status}',
      'basic',
      '["For", "Against", "Abstain"]',
      '${proposal.discussionThreadURL}'
    )`;
    return this.writeDb(query, this.currentGovernanceCycle);
  }

  async updateStatus(hash: string, status: string) {
    const now = new Date().toISOString();
    const query = oneLine`
      UPDATE ${proposalsTable} SET
      proposalStatus = '${status}',
      lastEditedTime = '${now}'
      WHERE uuid = '${hash}'
    `;
    return this.writeDb(query, this.currentGovernanceCycle);
  }

  async getToDiscuss(governanceCycle: number) {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Discussion'
      AND discussionURL IS NULL
    `, governanceCycle || this.currentGovernanceCycle);
  }

  async getDiscussionProposals(governanceCycle: number) {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Discussion'
      AND discussionURL IS NOT NULL
      AND title IS NOT NULL
    `, governanceCycle || this.currentGovernanceCycle);
  }

  async getTemperatureCheckProposals(governanceCycle: number) {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Temperature Check'
    `, governanceCycle || this.currentGovernanceCycle);
  }

  async getVoteProposals(governanceCycle?: number) {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Voting'
    `, governanceCycle || this.currentGovernanceCycle);
  }

  async getNextProposalId(governanceCycle?: number) {
    return this.queryDb(`
      SELECT proposalId FROM ${proposalsTable}
      ORDER BY proposalId DESC
      LIMIT 1
    `, governanceCycle || this.currentGovernanceCycle).then((res) => {
      return Number(res[0].proposalId) + 1;
    });
  }

  async updateDiscussionURL(proposal: Proposal) {
    return this.queryDb(`
      UPDATE ${proposalsTable} SET
      discussionURL = '${proposal.discussionThreadURL}'
      WHERE uuid = '${proposal.hash}'
    `, proposal.governanceCycle || this.currentGovernanceCycle);
  }

  async assignProposalIds(proposals: Proposal[]) {
    const nextProposalId = await this.getNextProposalId() ?? 1;
    proposals.forEach((proposal, index) => {
      if (!proposal.proposalId) {
        proposal.proposalId = (nextProposalId + index).toString();
      }
    });
    return proposals;
  }

  async updateStatusTemperatureCheckAndProposalId(proposals: Proposal[]) {
    const { query, values } = sqlQueryValues(proposals, ['status', 'proposalId']);
    const fullQuery = `INSERT INTO ${proposalsTable} ${allKeys} VALUES ${query} ON DUPLICATE KEY UPDATE ${values}`;
    return this.writeDb(fullQuery, this.currentGovernanceCycle);
  }

  async updateProposalStatuses(proposals: Proposal[]) {
    const { query, values } = sqlQueryValues(proposals, ['status']);
    return this.writeDb(`
      INSERT INTO ${proposalsTable}
      ${allKeys}
      VALUES ${query} ON DUPLICATE KEY UPDATE
        ${values}
    `, this.currentGovernanceCycle);
  }
}
