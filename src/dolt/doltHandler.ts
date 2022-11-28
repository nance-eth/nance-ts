/* eslint-disable no-param-reassign */
import { oneLine } from 'common-tags';
import { Proposal, PropertyKeys } from '../types';
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
    return this.dolt.write(proposal.governanceCycle?.toString() || this.currentGovernanceCycle.toString(), query);
  }

  async queryDb(query: string, governanceCycle: number) {
    return this.dolt.query(query, `${this.propertyKeys.governanceCycle}${governanceCycle.toString()}`).then((res) => {
      if (res.query_execution_status === 'Success') return res;
      return Promise.reject(res.query_execution_message);
    }).catch((e) => {
      return Promise.reject(e);
    });
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
      return Number(res.rows[0].proposalId) + 1;
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
    const nextProposalId = await this.getNextProposalId(proposals[0].governanceCycle);
    proposals.forEach((proposal, index) => {
      if (!proposal.governanceCycle) {
        proposal.proposalId = `${this.propertyKeys.proposalIdPrefix}${nextProposalId + index}`;
      }
    });
  }

  static sqlUpdateValues = (proposals: Proposal[], values: (keyof Proposal)[]) => {
    const dDate = new Date().toISOString();
    const dString = 'dummy';
    const dNumber = 0;
    const dJSON: any[] = [];
    values.push('hash'); // always include hash aka uuid
    return proposals.map((proposal) => {
      const p = Object.fromEntries(values.filter((key) => { return key in proposal; }).map((key) => { return [key, proposal[key as keyof Proposal]]; }));
      return oneLine`(
        '${p.hash}',
        '${dDate}',
        '${dDate}',
        '${p.title ?? dString}',
        '${p.body ?? dString}',
        '${p.type ?? dString}',
        ${p.governanceCycle ?? dNumber},
        '${p.status ?? dString}',
        ${p.proposalId ?? dNumber},
        '${p.discussionThreadURL ?? dString}',
        '${p.voteURL ?? dString}',
        '${dString}',
        '[${dJSON}]',
        '[${dJSON}]'
      )`;
    }).join(', ');
  };

  async updateStatusTemperatureCheckAndProposalId(proposals: Proposal[]) {
    const query = DoltHandler.sqlUpdateValues(proposals, ['status', 'discussionThreadURL']);
    console.log(query);
    return this.dolt.write(`
      INSERT INTO ${proposalsTable}
      (uuid, createdTime, lastEditedTime, title, body, category, governanceCycle, proposalStatus, proposalId, discussionURL, snapshotId, voteType, choices, snapshotVotes)
      VALUES ${query} ON DUPLICATE KEY UPDATE
        proposalStatus = VALUES(proposalStatus),
        discussionURL = VALUES(discussionURL)
    `, `GC${this.currentGovernanceCycle.toString()}`).then((res) => {
      this.dolt.poll(res.operation_name).then((ress) => {
        console.log(ress);
      });
    });
  }
}
