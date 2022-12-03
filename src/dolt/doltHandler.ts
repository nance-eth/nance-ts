/* eslint-disable no-param-reassign */
import { oneLine } from 'common-tags';
import * as objectHash from 'object-hash';
import { Proposal, PropertyKeys } from '../types';
// import { Dolt } from './doltAPI';
import { DoltSQL } from './doltSQL';
import { uuid } from '../utils';

const proposalsTable = 'proposals';
const payoutsTable = 'payouts';

export class DoltHandler {
  localDolt;
  propertyKeys;
  public currentGovernanceCycle = 0;

  constructor(
    repo: string,
    propertyKeys: PropertyKeys
  ) {
    this.localDolt = new DoltSQL({ database: repo });
    this.propertyKeys = propertyKeys;
  }

  async queryDb(query: string) {
    return this.localDolt.query(query).then((res) => {
      return res;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async setCurrentGovernanceCycle(governanceCycle: number) {
    return this.localDolt.checkout(`GC${governanceCycle}`).then((res) => {
      if (res === 0) { return true; }
      return false;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async addProposalToDb(proposal: Proposal) {
    const now = new Date().toISOString();
    const governanceCycle = (proposal.governanceCycle === 0) ? this.currentGovernanceCycle : proposal.governanceCycle;
    const voteType = proposal.voteSetup?.type || 'basic';
    const voteChoices = proposal.voteSetup?.choices || '["For", "Against", "Abstain"]';
    const proposalId = Number(proposal.proposalId.split(this.propertyKeys.proposalIdPrefix)[1]) || null;
    this.localDolt.db.query(oneLine`
      REPLACE INTO ${proposalsTable}
      (uuid, createdTime, lastEditedTime, title, body, authorAddress, category, governanceCycle, proposalStatus, proposalId, voteType, choices)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, [
      proposal.hash || uuid(), now, now, proposal.title, proposal.body, proposal.authorAddress, proposal.type, governanceCycle, proposal.status, proposalId, voteType, voteChoices
    ]);
    if (proposal.type?.toLowerCase().includes('pay')) {
      console.log(proposal.payout);
      const treasuryVersion = proposal.version?.split('V')[1];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let payAddress: string | null = proposal.payout!.address;
      let payProject;
      if (payAddress?.includes('V')) { [, payProject] = payAddress.split(':'); payAddress = null; }
      const payName = proposal.payout?.payName;
      const governanceStart = proposal.governanceCycle;
      const numberOfPayouts = proposal.payout?.count;
      const amount = proposal.payout?.amountUSD;
      const currency = 'usd';
      const payStatus = 'voting';
      const hashId = objectHash.default({ payAddress, payProject, payName, numberOfPayouts, governanceStart, uuidOfProposal: proposal.hash });
      this.localDolt.db.query(oneLine`
        REPLACE INTO ${payoutsTable}
        (hashId, uuidOfProposal, treasuryVersion, governanceCycleStart, numberOfPayouts,
        amount, currency, payAddress, payProject, payStatus, payName)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)`, [
        hashId, proposal.hash, treasuryVersion, governanceStart, numberOfPayouts, amount, currency, payAddress, payProject, payStatus, payName
      ]);
    }
  }

  async updateStatus(hash: string, status: string) {
    const now = new Date().toISOString();
    const query = oneLine`
      UPDATE ${proposalsTable} SET
      proposalStatus = '${status}',
      lastEditedTime = '${now}'
      WHERE uuid = '${hash}'
    `;
    return this.queryDb(query);
  }

  async getToDiscuss() {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Discussion'
      AND discussionURL IS NULL
    `);
  }

  async getDiscussionProposals() {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Discussion'
      AND discussionURL IS NOT NULL
      AND title IS NOT NULL
    `);
  }

  async getTemperatureCheckProposals() {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Temperature Check'
    `);
  }

  async getVoteProposals() {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Voting'
    `);
  }

  async getNextProposalId() {
    return this.queryDb(`
      SELECT proposalId FROM ${proposalsTable}
      ORDER BY proposalId DESC
      LIMIT 1
    `).then((res) => {
      return Number(res) + 1;
    });
  }

  async updateDiscussionURL(proposal: Proposal) {
    return this.queryDb(`
      UPDATE ${proposalsTable} SET
      discussionURL = '${proposal.discussionThreadURL}'
      WHERE uuid = '${proposal.hash}'
    `);
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

  async updateStatusTemperatureCheckAndProposalId(proposal: Proposal) {
    const query = `
      UPDATE ${proposalsTable} SET
      proposalStatus = '${proposal.status}', proposalId = ${proposal.proposalId}
      WHERE uuid = '${proposal.hash}'`;
    return this.queryDb(query);
  }

  async updateProposalStatus(proposal: Proposal) {
    const query = `UPDATE ${proposalsTable} SET proposalStatus = ${proposal.status}`;
    return this.queryDb(query);
  }
}
