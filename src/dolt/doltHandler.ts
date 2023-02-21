/* eslint-disable no-param-reassign */
import { oneLine } from 'common-tags';
import { Proposal, PropertyKeys } from '../types';
import { GovernanceCycle, SQLProposal, SQLPayout, SQLReserve, SQLExtended } from './schema';
import { DoltSQL } from './doltSQL';
import { getLastSlash, uuid } from '../utils';
import { DBConfig } from './types';

const proposalsTable = 'proposals';
const payoutsTable = 'payouts';
const reservesTable = 'reserves';
const governanceCyclesTable = 'governanceCycles';

// we are mixing abstracted and direct db queries, use direct mysql2 queries when there are potential NULL values in query
export class DoltHandler {
  localDolt;
  propertyKeys;
  public currentGovernanceCycle = 0;

  constructor(
    options: DBConfig,
    propertyKeys: PropertyKeys
  ) {
    this.localDolt = new DoltSQL(options);
    this.propertyKeys = propertyKeys;
  }

  async queryDb(query: string) {
    return this.localDolt.query(query).then((res) => {
      return res;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async queryProposals(query: string, variables?: string[]): Promise<Proposal[]> {
    return this.localDolt.queryRows(query, variables).then((res) => {
      return res.map((r) => {
        return this.toProposal(r as SQLProposal & SQLPayout);
      });
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async queryDbResults(query: string) {
    return this.localDolt.queryResults(query).then((res) => {
      return res;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  toProposal(proposal: SQLExtended): Proposal {
    const voteURL = proposal.snapshotId ?? '';
    const proposalId = (proposal.proposalId) ? `${this.propertyKeys.proposalIdPrefix}${proposal.proposalId}` : '';
    const cleanProposal: Proposal = {
      hash: proposal.uuid,
      title: proposal.title,
      body: proposal.body,
      type: proposal.category,
      status: proposal.proposalStatus,
      proposalId,
      discussionThreadURL: proposal.discussionURL ?? '',
      url: `https://${this.propertyKeys.publicURLPrefix}/${proposal.uuid}`,
      ipfsURL: '',
      voteURL,
      date: proposal.createdTime.toDateString(),
      governanceCycle: proposal.governanceCycle,
      authorAddress: proposal.authorAddress
    };
    if (proposal.amount) {
      cleanProposal.payout = {
        address: proposal.payAddress ?? '',
        amountUSD: proposal.amount,
        count: proposal.numberOfPayouts,
        payName: proposal.payName ?? ''
      };
    }
    if (proposal.snapshotVotes) {
      cleanProposal.voteResults = {
        choices: proposal.choices,
        scores: proposal.snapshotVotes,
        votes: proposal.voteAddressCount
      };
    }
    return cleanProposal;
  }

  async getCurrentGovernanceCycle() {
    let { cycleNumber } = (await this.queryDb(`
    SELECT MAX(cycleNumber) as cycleNumber from ${governanceCyclesTable}
    `) as unknown as Array<{ cycleNumber: number }>)[0];
    cycleNumber ||= 1;
    return cycleNumber;
  }

  async setCurrentGovernanceCycle(governanceCycle: number) {
    const branches = await this.localDolt.showBranches();
    const branchExists = branches.some((branch) => { return branch.name === (`GC${governanceCycle}`); });
    return this.localDolt.checkout(`GC${governanceCycle}`, !branchExists).then((res) => {
      this.currentGovernanceCycle = governanceCycle;
      if (res === 0) { return true; }
      return false;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async incrementGovernanceCycle() {
    return this.queryDbResults(`
      INSERT INTO ${governanceCyclesTable} (cycleNumber)
      SELECT COALESCE(MAX(cycleNumber) + 1, 1) FROM ${governanceCyclesTable}
    `);
  }

  proposalIdNumber = (proposalId: string): number | null => {
    const value = Number(proposalId.split(this.propertyKeys.proposalIdPrefix)[1]);
    return (Number.isNaN(value)) ? null : value;
  };

  async addProposalToDb(proposal: Proposal, edit = false) {
    const now = new Date().toISOString();
    const voteType = proposal.voteSetup?.type || 'basic';
    const voteChoices = proposal.voteSetup?.choices || ['For', 'Against', 'Abstain'];
    const proposalId = (proposal.proposalId) ? this.proposalIdNumber(proposal.proposalId) : null;
    proposal.status = proposal.status || 'Discussion';
    proposal.hash = proposal.hash || uuid();
    await this.localDolt.db.query(oneLine`
      INSERT INTO ${proposalsTable}
      (uuid, createdTime, lastEditedTime, title, body, authorAddress, category, governanceCycle, proposalStatus, proposalId, discussionURL, voteType, choices)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
      lastEditedTime = VALUES(lastEditedTime), title = VALUES(title), body = VALUES(body), category = VALUES(category), governanceCycle = VALUES(governanceCycle),
      discussionURL = VALUES(discussionURL), proposalStatus = VALUES(proposalStatus), voteType = VALUES(voteType), choices = VALUES(choices)`,
    [proposal.hash, now, now, proposal.title, proposal.body, proposal.authorAddress, proposal.type, proposal.governanceCycle, proposal.status, proposalId, proposal.discussionThreadURL, voteType, JSON.stringify(voteChoices)]);
    if (proposal.type?.toLowerCase().includes('pay')) {
      if (edit) {
        await this.editPayout(proposal);
      } else {
        // await this.addPayoutToDb(proposal);
      }
    }
    return proposal.hash;
  }

  async addPayoutToDb(proposal: Proposal) {
    const treasuryVersion = proposal.version?.split('V')[1] ?? proposal.version;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let payAddress: string | null = proposal.payout?.address ?? '';
    let payProject;
    if (payAddress?.includes('V')) { [, payProject] = payAddress.split(':'); payAddress = null; }
    const payName = proposal.payout?.payName;
    const governanceStart = proposal.governanceCycle;
    const numberOfPayouts = proposal.payout?.count;
    const amount = proposal.payout?.amountUSD;
    const currency = 'usd';
    const payStatus = 'voting';
    await this.localDolt.db.query(oneLine`
      INSERT INTO ${payoutsTable}
      (uuid, uuidOfProposal, treasuryVersion, governanceCycleStart, numberOfPayouts,
      amount, currency, payAddress, payProject, payStatus, payName)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    [uuid(), proposal.hash, treasuryVersion, governanceStart, numberOfPayouts, amount, currency, payAddress, payProject, payStatus, payName]);
  }

  async editPayout(proposal: Proposal) {
    const treasuryVersion = proposal.version?.split('V')[1] ?? proposal.version;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let payAddress: string | null = proposal.payout!.address;
    let payProject;
    if (payAddress?.includes('V')) { [, payProject] = payAddress.split(':'); payAddress = null; }
    const payName = proposal.payout?.payName;
    const governanceStart = proposal.governanceCycle;
    const numberOfPayouts = proposal.payout?.count;
    const amount = proposal.payout?.amountUSD;
    const currency = 'usd';
    const payStatus = proposal.status;
    this.localDolt.db.query(oneLine`
      UPDATE ${payoutsTable} SET
      treasuryVersion = ?, governanceCycleStart = ?, numberOfPayouts = ?, amount = ?,
      currency = ?, payAddress = ?, payProject = ?, payStatus = ?, payName = ?
      WHERE uuidOfProposal = ?`,
    [treasuryVersion, governanceStart, numberOfPayouts, amount, currency, payAddress, payProject, payStatus, payName, proposal.hash]);
  }

  async deleteProposal(hash: string) {
    const queryProposals = oneLine`
      DELETE FROM ${proposalsTable}
      WHERE uuid = '${hash}'
    `;
    return this.queryDbResults(queryProposals).then(async (res) => {
      const queryPayouts = oneLine`
        DELETE FROM ${payoutsTable}
        WHERE uuidOfProposal = '${hash}'
      `;
      return this.queryDbResults(queryPayouts).then((payRes) => {
        return (res.affectedRows + payRes.affectedRows);
      }).catch((e) => { return Promise.reject(e); });
    }).catch((e) => { return Promise.reject(e); });
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
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Discussion'
      AND governanceCycle = '${this.currentGovernanceCycle}'
      AND discussionURL IS NULL
    `);
  }

  async getDiscussionProposals() {
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Discussion'
      AND governanceCycle = '${this.currentGovernanceCycle}'
      AND discussionURL IS NOT NULL
      AND title IS NOT NULL
    `);
  }

  async getTemperatureCheckProposals() {
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Temperature Check'
      AND governanceCycle = '${this.currentGovernanceCycle}'
    `);
  }

  async getVoteProposals() {
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Voting'
      AND governanceCycle = '${this.currentGovernanceCycle}'
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

  async getProposalsByGovernanceCycle(governanceCycle: string) {
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable}
      WHERE governanceCycle = ${Number(governanceCycle)}
      ORDER BY snapshotId DESC, proposalId ASC
    `);
  }

  async getProposalsByGovernanceCycleAndKeyword(governanceCycle: string, keyword: string) {
    const search = keyword.replaceAll('%20', ' ');
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable}
      WHERE
      governanceCycle = ${governanceCycle}
      AND 
      ( 
        body like '%${search}%'
        OR title like '%${search}%'
      )
      ORDER BY createdTime DESC
    `);
  }

  async getProposalsByKeyword(keyword: string) {
    const search = keyword.replaceAll('%20', ' ');
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable}
      WHERE
      body like '%${search}%'
      OR title like '%${search}%'
      ORDER BY proposalId ASC
    `);
  }

  async getContentMarkdown(hash: string) {
    const proposal = await this.queryDb(`
      SELECT * FROM ${proposalsTable}
      WHERE uuid = '${hash}'
    `) as SQLExtended[];
    if (proposal.length === 0) return [];
    return this.toProposal(proposal[0]);
  }

  async getProposalByAnyId(hashOrId: string) {
    let where = '';
    if (hashOrId.length === 32) {
      where = `WHERE ${proposalsTable}.uuid = '${hashOrId}'`;
    } if (hashOrId.includes(this.propertyKeys.proposalIdPrefix)) {
      where = `WHERE ${proposalsTable}.proposalId = ${this.proposalIdNumber(hashOrId)}`;
    } if (hashOrId.startsWith('0x')) {
      where = `WHERE ${proposalsTable}.snapshotId = '${hashOrId}'`;
    }
    return this.queryProposals(`
      SELECT * from ${proposalsTable} ${where}
    `);
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
        proposal.proposalId = `${this.propertyKeys.proposalIdPrefix}${(nextProposalId + index).toString()}`;
      }
    });
    return proposals;
  }

  async updateStatusTemperatureCheckAndProposalId(proposal: Proposal) {
    const query = `
      UPDATE ${proposalsTable} SET
      proposalStatus = '${proposal.status}',
      proposalId = ${this.proposalIdNumber(proposal.proposalId)}
      WHERE uuid = '${proposal.hash}'
    `;
    return this.queryDb(query);
  }

  async updateTemperatureCheckClose(proposal: Proposal) {
    const query = `
      UPDATE ${proposalsTable} SET
      temperatureCheckVotes = '[${proposal.temperatureCheckVotes}]',
      proposalStatus = '${proposal.status}',
      title = '${proposal.title}'
      WHERE uuid = '${proposal.hash}'
    `;
    console.log(query);
    return this.queryDb(query);
  }

  async updateVotingSetup(proposal: Proposal) {
    const results = this.localDolt.db.query(`
    UPDATE ${proposalsTable} SET
    title = ?, proposalStatus = ?, snapshotId = ? WHERE uuid = ?
  `, [proposal.title, proposal.status, getLastSlash(proposal.voteURL), proposal.hash]);
    return results;
  }

  async updateVotingClose(proposal: Proposal) {
    const voteChoices = (proposal.internalVoteResults) ? JSON.stringify(Object.keys(proposal.internalVoteResults.scores)) : null;
    const voteResults = (proposal.internalVoteResults) ? JSON.stringify(Object.values(proposal.internalVoteResults.scores)) : null;
    await this.localDolt.db.query(oneLine`
      UPDATE ${proposalsTable} SET
      choices = ?,
      snapshotVotes = ?,
      voteAddressCount = ?,
      proposalStatus = ?
      WHERE uuid = ?
    `, [voteChoices, voteResults, proposal.internalVoteResults?.totalVotes, proposal.status, proposal.hash]);
    if (proposal.type?.toLowerCase().includes('pay')) {
      await this.updatePayoutStatus(proposal);
    }
  }

  async updatePayoutStatus(proposal: Proposal) {
    const payStatus = (proposal.status === this.propertyKeys.statusApproved) ? 'active' : 'cancelled';
    this.localDolt.db.query(`
      UPDATE ${payoutsTable} SET
      payStatus = ?
      WHERE uuidOfProposal = ?
  `, [payStatus, proposal.hash]);
  }

  async addGovernanceCycleToDb(g: GovernanceCycle) {
    const results = this.localDolt.db.query(oneLine`
      REPLACE INTO ${governanceCyclesTable}
      (cycleNumber, startDateTime, endDateTime, jbV1FundingCycle, jbV2FundingCycle, jbV3FundingCycle, acceptingProposals)
      VALUES(?,?,?,?,?,?,?)`, [g.cycleNumber, g.startDatetime, g.endDatetime, g.jbV1FundingCycle, g.jbV2FundingCycle, g.jbV3FundingCycle, true]
    );
    return results;
  }

  async pushProposals(proposal: Proposal): Promise<number> {
    return this.localDolt.commit(`Add proposal ${proposal.hash.substring(0, 7)}...${proposal.hash.substring(proposal.hash.length - 7)}`).then(() => {
      return this.localDolt.push(`GC${this.currentGovernanceCycle}`);
    });
  }

  async getPayoutsDb(version: string): Promise<SQLPayout[]> {
    const treasuryVersion = Number(version.split('V')[1]);
    const currentGovernanceCycle = await this.getCurrentGovernanceCycle();
    const results = this.queryDb(`
      SELECT ${payoutsTable}.*, ${proposalsTable}.authorDiscordId, ${proposalsTable}.proposalId, ${proposalsTable}.snapshotId FROM ${payoutsTable}
      INNER JOIN ${proposalsTable} ON ${payoutsTable}.uuidOfProposal = ${proposalsTable}.uuid
      WHERE treasuryVersion = ${treasuryVersion} AND
      payStatus = 'active' AND
      governanceCycleStart <= ${currentGovernanceCycle} AND
      governanceCycleStart + numberOfPayouts >= ${currentGovernanceCycle}
      ORDER BY proposalId ASC
    `) as unknown as SQLPayout[];
    return results;
  }

  async getPreviousPayoutsDb(version: string, governanceCycle: number): Promise<SQLPayout[]> {
    const treasuryVersion = Number(version.split('V')[1]);
    const results = this.queryDb(`
      SELECT ${payoutsTable}.*, ${proposalsTable}.authorDiscordId, ${proposalsTable}.proposalId, ${proposalsTable}.snapshotId FROM ${payoutsTable}
      INNER JOIN ${proposalsTable} ON ${payoutsTable}.uuidOfProposal = ${proposalsTable}.uuid
      WHERE treasuryVersion = ${treasuryVersion} AND
      payStatus != 'cancelled' AND
      governanceCycleStart <= ${governanceCycle} AND
      governanceCycleStart + numberOfPayouts >= ${governanceCycle + 1}
      ORDER BY proposalId ASC
    `) as unknown as SQLPayout[];
    return results;
  }

  async setStalePayouts(): Promise<number> {
    const currentGovernanceCycle = await this.getCurrentGovernanceCycle();
    const results = await this.queryDbResults(`
      UPDATE ${payoutsTable} SET payStatus = 'complete' WHERE
      payStatus = 'active' AND
      governanceCycleStart <= ${currentGovernanceCycle - 1} AND
      governanceCycleStart + numberOfPayouts <= ${currentGovernanceCycle}
    `).then((res) => {
      return res.affectedRows;
    });
    return results;
  }

  async getReserveDb(): Promise<SQLReserve[]> {
    const results = this.queryDb(`
      SELECT * from ${reservesTable}
      WHERE reserveStatus = 'active'
    `) as unknown as SQLReserve[];
    return results;
  }
}
