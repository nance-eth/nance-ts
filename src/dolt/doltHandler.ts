/* eslint-disable no-param-reassign */
import { oneLine } from 'common-tags';
import { Proposal, PropertyKeys } from '../types';
import { GovernanceCycle, SQLProposal } from './schema';
import { DoltSQL } from './doltSQL';
import { getLastSlash, uuid } from '../utils';

const proposalsTable = 'proposals';
const payoutsTable = 'payouts';
const governanceCyclesTable = 'governanceCycles';

// we are mixing abstracted and direct db queries, use direct mysql2 queries when there are potential NULL values in query
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

  async queryProposals(query: string): Promise<Proposal[]> {
    return this.localDolt.queryRows(query).then((res) => {
      return res.map((r) => {
        return this.toProposal(r as SQLProposal);
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

  toProposal(proposal: SQLProposal): Proposal {
    const voteURL = proposal.snapshotId ?? '';
    const proposalId = (proposal.proposalId) ? `${this.propertyKeys.proposalIdPrefix}${proposal.proposalId}` : '';
    return {
      hash: proposal.uuid,
      title: proposal.title,
      body: proposal.body,
      status: proposal.proposalStatus,
      proposalId,
      url: '',
      ipfsURL: '',
      voteURL,
      discussionThreadURL: proposal.discussionURL ?? '',
      type: proposal.category
    };
  }

  async getCurrentGovernanceCycle() {
    const currentCycle = (await this.queryDb(`
      SELECT cycleNumber from ${governanceCyclesTable} WHERE acceptingProposals = 1 ORDER BY ABS(DATEDIFF(startDatetime, NOW()))
    `) as unknown as Array<{ cycleNumber: number }>)[0];
    if (!currentCycle) { return 1; }
    return currentCycle.cycleNumber;
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

  proposalIdNumber = (proposalId: string): number => {
    return Number(proposalId.split(this.propertyKeys.proposalIdPrefix)[1]);
  };

  async addProposalToDb(proposal: Proposal, edit = false) {
    await this.localDolt.checkout(`GC${this.currentGovernanceCycle}`); // ensure proper branch is checked out
    const now = new Date().toISOString();
    proposal.governanceCycle = (proposal.governanceCycle === 0) ? this.currentGovernanceCycle : proposal.governanceCycle ?? this.currentGovernanceCycle;
    const voteType = proposal.voteSetup?.type || 'basic';
    const voteChoices = proposal.voteSetup?.choices || ['For', 'Against', 'Abstain'];
    const proposalId = (proposal.proposalId) ? this.proposalIdNumber(proposal.proposalId) : null;
    proposal.status = proposal.status || 'Draft';
    proposal.hash = proposal.hash || uuid();
    await this.localDolt.db.query(oneLine`
      INSERT INTO ${proposalsTable}
      (uuid, createdTime, lastEditedTime, title, body, authorAddress, category, governanceCycle, proposalStatus, proposalId, discussionURL, voteType, choices)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
      lastEditedTime = VALUES(lastEditedTime), title = VALUES(title), body = VALUES(body), category = VALUES(category), governanceCycle = VALUES(governanceCycle),
      proposalStatus = VALUES(proposalStatus), voteType = VALUES(voteType), choices = VALUES(choices)`,
    [proposal.hash, now, now, proposal.title, proposal.body, proposal.authorAddress, proposal.type, proposal.governanceCycle, proposal.status, proposalId, proposal.discussionThreadURL, voteType, JSON.stringify(voteChoices)]);
    if (proposal.type?.toLowerCase().includes('pay')) {
      if (edit) {
        await this.editPayout(proposal);
      } else {
        await this.addPayoutToDb(proposal);
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
      return this.queryDbResults(queryPayouts).then(() => {
        return res.affectedRows;
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
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Discussion'
      AND governanceCycle = '${this.currentGovernanceCycle}'
      AND discussionURL IS NULL
    `);
  }

  async getDiscussionProposals() {
    return this.queryDb(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = 'Discussion'
      AND governanceCycle = '${this.currentGovernanceCycle}'
      AND discussionURL IS NOT NULL
      AND title IS NOT NULL
    `);
  }

  async getTemperatureCheckProposals() {
    return this.queryDb(`
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
    const proposals = await this.queryDb(`
      SELECT * FROM ${proposalsTable}
      WHERE governanceCycle = ${Number(governanceCycle)}
    `) as SQLProposal[];
    return proposals.map((proposal) => {
      return this.toProposal(proposal);
    });
  }

  async getContentMarkdown(hash: string) {
    const proposal = await this.queryDb(`
      SELECT * FROM ${proposalsTable}
      WHERE uuid = '${hash}'
    `) as SQLProposal[];
    if (proposal.length === 0) return [];
    return this.toProposal(proposal[0]);
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
    return this.queryDb(query);
  }

  async updateVotingSetup(proposal: Proposal) {
    const query = oneLine`
      UPDATE ${proposalsTable} SET
      title = '${proposal.title}',
      snapshotId = '${getLastSlash(proposal.voteURL)}'
      WHERE uuid = '${proposal.hash}'
    `;
    return this.queryDb(query);
  }

  async updateVotingClose(proposal: Proposal) {
    this.localDolt.db.query(oneLine`
      UPDATE ${proposalsTable} SET
      choices = '${JSON.stringify(Object.keys(proposal.voteResults?.scores ?? ''))}',
      snapshotVotes = "[${Object.values(proposal.voteResults?.scores ?? '')}]"
      WHERE uuid = ?
    `, [proposal.hash]);
    if (proposal.type?.toLowerCase().includes('pay')) {
      this.updatePayoutStatus(proposal);
    }
  }

  async updatePayoutStatus(proposal: Proposal) {
    const payStatus = (proposal.status === this.propertyKeys.statusApproved) ? 'active' : 'cancelled';
    this.localDolt.db.query(`
      UPDATE ${payoutsTable} SET
      payStatus = ?
      WHERE uuid = ?
  `, [payStatus, proposal.hash]);
  }

  async addGovernanceCycleToDb(g: GovernanceCycle) {
    return this.localDolt.db.query(oneLine`
      INSERT INTO ${governanceCyclesTable}
      (cycleNumber, startDateTime, endDateTime, jbV1FundingCycle, jbV2FundingCycle, jbV3FundingCycle, acceptingProposals)
      VALUES(?,?,?,?,?,?,?)`, [g.cycleNumber, g.startDatetime, g.endDatetime, g.jbV1FundingCycle, g.jbV2FundingCycle, g.jbV3FundingCycle, true]
    ).catch((e) => {
      return Promise.reject(e);
    });
  }

  async pushProposal(proposal: Proposal): Promise<number> {
    return this.localDolt.commit(`Add proposal ${proposal.hash.substring(0, 7)}...${proposal.hash.substring(proposal.hash.length - 7)}`).then(() => {
      return this.localDolt.push(`GC${this.currentGovernanceCycle}`);
    });
  }
}
