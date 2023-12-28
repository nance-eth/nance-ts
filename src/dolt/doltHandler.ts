/* eslint-disable max-lines */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-param-reassign */
import { oneLine } from 'common-tags';
import { omitBy, isNil } from 'lodash';
import { Proposal, Transfer, Payout, CustomTransaction, Reserve } from '../types';
import { SQLProposal, SQLPayout, SQLReserve, SQLExtended, SQLTransfer, SQLCustomTransaction } from './schema';
import { DoltSQL } from './doltSQL';
import { IPFS_GATEWAY, uuidGen, isHexString } from '../utils';
import { SELECT_ACTIONS } from './queries';
import { STATUS } from '../constants';

const proposalsTable = 'proposals';
const privateProposalsTable = 'private_proposals';
const payoutsTable = 'payouts';
const reservesTable = 'reserves';
const transfersTable = 'transfers';
const transactionsTable = 'customTransactions';
const DEFAULT_TREASURY_VERSION = 3;

// we are mixing abstracted and direct db queries, use direct mysql2 queries when there are potential NULL values in query
export class DoltHandler {
  localDolt;
  proposalIdPrefix;

  constructor(
    localDolt: DoltSQL,
    proposalIdPrefix: string
  ) {
    this.localDolt = localDolt;
    this.proposalIdPrefix = proposalIdPrefix;
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
        return this.toProposal(r as SQLExtended);
      });
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async queryDbResults(query: string, variables?: (string | number | undefined)[]) {
    return this.localDolt.queryResults(query, variables).then((res) => {
      return res;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  toProposal(proposal: SQLExtended): Proposal {
    const voteURL = proposal.snapshotId ?? '';
    const actions = () => {
      // clunky but ok for now
      if (typeof proposal.actions === 'string') return JSON.parse(proposal.actions as unknown as string).flat(); // from proposals table
      if (typeof proposal.actions === 'object') return proposal.actions; // from private proposals table
      return undefined;
    };
    const cleanProposal: Proposal = {
      hash: proposal.uuid,
      title: isHexString(proposal.title) ? Buffer.from(proposal.title, 'hex').toString('utf8') : proposal.title,
      body: isHexString(proposal.body) ? Buffer.from(proposal.body, 'hex').toString('utf8') : proposal.body,
      status: proposal.proposalStatus || 'Private',
      proposalId: proposal.proposalId || null,
      discussionThreadURL: proposal.discussionURL ?? '',
      ipfsURL: proposal.ipfsCID ? `${IPFS_GATEWAY}/ipfs/${proposal.ipfsCID}` : '',
      voteURL,
      date: proposal.createdTime.toISOString(),
      lastEditedTime: proposal.lastEditedTime?.toISOString(),
      governanceCycle: proposal.governanceCycle,
      authorAddress: proposal.authorAddress,
      coauthors: proposal.coauthors,
      actions: actions()
    };
    if (proposal.voteType !== 'basic') {
      cleanProposal.voteSetup = {
        type: proposal.voteType,
        choices: proposal.choices
      };
    }
    if (proposal.snapshotVotes) {
      cleanProposal.voteResults = {
        choices: proposal.choices,
        scores: proposal.snapshotVotes,
        votes: proposal.voteAddressCount,
        scores_total: proposal.snapshotVotes.reduce((a, b) => { return a + b; }, 0),
        quorumMet: false, // we dont have this data in the db
      };
    }
    if (proposal.temperatureCheckVotes) {
      cleanProposal.temperatureCheckVotes = proposal.temperatureCheckVotes;
    }
    return cleanProposal;
  }

  // eslint-disable-next-line class-methods-use-this
  toSQLProposal(proposal: Partial<Proposal>): Partial<SQLProposal> {
    const sqlProposal = {
      uuid: proposal.hash,
      title: proposal.title || undefined,
      body: proposal.body || undefined,
      proposalStatus: proposal.status,
      proposalId: proposal.proposalId || undefined,
      discussionURL: proposal.discussionThreadURL || undefined,
      governanceCycle: proposal.governanceCycle || undefined,
      authorAddress: proposal.authorAddress || undefined,
      coauthors: JSON.stringify(proposal.coauthors) || undefined,
    };
    return omitBy(sqlProposal, isNil);
  }

  // eslint-disable-next-line class-methods-use-this
  toPrivateSQLProposal(proposal: Partial<Proposal>): Partial<SQLProposal> {
    const sqlProposal = {
      uuid: proposal.hash,
      title: proposal.title || undefined,
      body: proposal.body || undefined,
      authorAddress: proposal.authorAddress || undefined,
      coauthors: JSON.stringify(proposal.coauthors) || undefined,
    };
    return omitBy(sqlProposal, isNil);
  }

  proposalIdNumber = (proposalId: string): number | null => {
    const value = Number(proposalId.split(this.proposalIdPrefix)[1]);
    return (Number.isNaN(value)) ? null : value;
  };

  async actionDirector(proposal: Proposal) {
    const cycle = proposal.governanceCycle || 1;
    let actionStatus = STATUS.ACTION.VOTING; // default to voting
    if (proposal.status === STATUS.APPROVED) { actionStatus = STATUS.ACTION.ACTIVE; }
    if (proposal.status === STATUS.CANCELLED) { actionStatus = STATUS.ACTION.CANCELLED; }
    proposal.actions?.forEach((action) => {
      if (action.type === 'Payout') {
        this.addPayoutToDb(action.payload as Payout, proposal.hash, cycle, action?.name || proposal.title, action.uuid, actionStatus);
      } else if (action.type.includes('Transfer')) {
        this.addTransferToDb(action.payload as Transfer, proposal.hash, cycle, action?.name || proposal.title, action.uuid, undefined, actionStatus);
      } else if (action.type === 'Reserve') {
        this.addReserveToDb(action.payload as Reserve, proposal.hash, cycle, action.uuid, actionStatus);
      } else if (action.type === 'Custom Transaction') {
        this.addCustomTransaction(action.payload as CustomTransaction, proposal.hash, cycle, action?.name || proposal.title, action.uuid, actionStatus);
      }
    });
  }

  // ===================================== //
  // ========== add functions ============ //
  // ===================================== //

  async addPrivateProposalToDb(proposal: Proposal) {
    const now = new Date().toISOString();
    proposal.hash = proposal.hash || uuidGen();
    await this.localDolt.db.query(oneLine`
      INSERT INTO ${privateProposalsTable}
      (uuid, createdTime, lastEditedTime, title, body, authorAddress, coauthors, actions)
      VALUES(?,?,?,?,?,?,?,?)`,
    [proposal.hash, now, now, proposal.title, proposal.body, proposal.authorAddress, JSON.stringify(proposal.coauthors), JSON.stringify(proposal.actions)],
    );
    return proposal.hash;
  }

  async addProposalToDb(proposal: Proposal) {
    const now = new Date().toISOString();
    const voteType = proposal.voteSetup?.type || 'basic';
    const voteChoices = proposal.voteSetup?.choices || ['For', 'Against', 'Abstain'];
    proposal.status = proposal.status || 'Discussion';
    proposal.hash = proposal.hash || uuidGen();
    proposal.proposalId = (proposal.status === 'Discussion') ? await this.getNextProposalId() : proposal.proposalId || null;
    await this.localDolt.db.query(oneLine`
      INSERT INTO ${proposalsTable}
      (uuid, createdTime, lastEditedTime, title, body, authorAddress, authorDiscordId,
        governanceCycle, proposalStatus, proposalId, discussionURL, voteType, choices,
        snapshotVotes, snapshotId, voteAddressCount)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [proposal.hash, proposal.createdTime || now, now, proposal.title, proposal.body, proposal.authorAddress, proposal.authorDiscordId,
      proposal.governanceCycle, proposal.status, proposal.proposalId, proposal.discussionThreadURL, voteType, JSON.stringify(voteChoices),
      JSON.stringify(proposal.voteResults?.scores), proposal.voteURL, proposal.voteResults?.votes
    ]);
    return proposal.hash;
  }

  async addPayoutToDb(payout: Payout, uuidOfProposal: string, governanceCycle: number, payName: string, uuid?: string, status?: string) {
    const treasuryVersion = DEFAULT_TREASURY_VERSION;
    const governanceStart = governanceCycle;
    const numberOfPayouts = payout.count;
    const amount = payout.amountUSD;
    const currency = 'usd';
    await this.localDolt.db.query(oneLine`
      INSERT IGNORE INTO ${payoutsTable}
      (uuidOfPayout, uuidOfProposal, treasuryVersion, governanceCycleStart, numberOfPayouts,
      amount, currency, payAddress, payProject, payStatus, payName)
      VALUES(?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
      governanceCycleStart = VALUES(governanceCycleStart), numberOfPayouts = VALUES(numberOfPayouts), amount = VALUES(amount), currency = VALUES(currency),
      payAddress = VALUES(payAddress), payProject = VALUES(payProject), payStatus = VALUES(payStatus), payName = VALUES(payName)`,
    [uuid || uuidGen(), uuidOfProposal, treasuryVersion, governanceStart, numberOfPayouts, amount, currency, payout.address, payout.project, status, payName]);
  }

  async addTransferToDb(transfer: Transfer, uuidOfProposal: string, transferGovernanceCycle: number, transferName: string, uuid?: string, transferCount = 1, status?: string) {
    const { to, contract, amount, tokenName } = transfer;
    await this.localDolt.db.query(oneLine`
      INSERT IGNORE INTO ${transfersTable}
      (uuidOfTransfer, uuidOfProposal, transferGovernanceCycle, transferCount, transferName, transferAddress, transferTokenName, transferTokenAddress, transferAmount, transferStatus)
      VALUES(?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
      transferGovernanceCycle = VALUES(transferGovernanceCycle), transferCount = VALUES(transferCount), transferName = VALUES(transferName),
      transferAddress = VALUES(transferAddress), transferTokenName = VALUES(transferTokenName), transferTokenAddress = VALUES(transferTokenAddress),
      transferAmount = VALUES(transferAmount), transferStatus = VALUES(transferStatus)`,
    [uuid || uuidGen(), uuidOfProposal, transferGovernanceCycle, transferCount, transferName, to, tokenName, contract, amount || 1, status]);
  }

  async addCustomTransaction(customTransaction: CustomTransaction, uuidOfProposal: string, transactionGovernanceCycle: number, transactionName: string, uuid?: string, status?: string, transactionCount = 1) {
    const address = customTransaction.contract;
    const { value, functionName, args } = customTransaction;
    const argsArray = JSON.stringify(args);
    await this.localDolt.db.query(oneLine`
      INSERT IGNORE INTO ${transactionsTable}
      (uuidOfTransaction, uuidOfProposal, transactionGovernanceCycle, transactionCount, transactionName,
        transactionAddress, transactionValue, transactionFunctionName, transactionFunctionArgs, transactionStatus, transactionTenderlyId)
      VALUES(?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
      transactionGovernanceCycle = VALUES(transactionGovernanceCycle), transactionCount = VALUES(transactionCount), transactionName = VALUES(transactionName),
      transactionAddress = VALUES(transactionAddress), transactionValue = VALUES(transactionValue), transactionFunctionName = VALUES(transactionFunctionName),
      transactionFunctionArgs = VALUES(transactionFunctionArgs), transactionStatus = VALUES(transactionStatus)`,
    [uuid || uuidGen(), uuidOfProposal, transactionGovernanceCycle, transactionCount, transactionName, address, value, functionName, argsArray,
      status, customTransaction.tenderlyId]);
  }

  async addReserveToDb(reserve: Reserve, uuidOfProposal: string, reserveGovernanceCycle: number, uuid?: string, status?: string) {
    await this.localDolt.db.query(oneLine`
      INSERT IGNORE INTO ${reservesTable}
      (uuidOfReserve, uuidOfProposal, reserveGovernanceCycle, splits, reserveStatus)
      VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE
      reserveGovernanceCycle = VALUES(reserveGovernanceCycle), splits = VALUES(splits), reserveStatus = VALUES(reserveStatus)`,
    [uuid || uuidGen(), uuidOfProposal, reserveGovernanceCycle, JSON.stringify(reserve.splits), status]);
  }

  async assignProposalIds(proposals: Proposal[]) {
    const nextProposalId = await this.getNextProposalId() ?? 1;
    proposals.forEach((proposal, index) => {
      if (!proposal.proposalId) {
        proposal.proposalId = nextProposalId + index;
      }
    });
    return proposals;
  }

  // ===================================== //
  // ====== edit/update functions ======== //
  // ===================================== //

  async editProposal(proposal: Partial<Proposal>) {
    const updates: string[] = [];
    const cleanedProposal = this.toSQLProposal(proposal);
    cleanedProposal.lastEditedTime = new Date();
    Object.keys(cleanedProposal).forEach((key) => {
      updates.push(`${key} = ?`);
    });
    const query = `UPDATE ${proposalsTable} SET ${updates.join(',')} WHERE uuid = ?`;
    const vars = [...Object.values(cleanedProposal), cleanedProposal.uuid];
    await this.localDolt.db.query(query, vars);
    return proposal.hash || Promise.reject('Proposal hash not found');
  }

  async editPrivateProposal(proposal: Partial<Proposal>) {
    const updates: string[] = [];
    const cleanedProposal = this.toPrivateSQLProposal(proposal);
    cleanedProposal.lastEditedTime = new Date();
    Object.keys(cleanedProposal).forEach((key) => {
      updates.push(`${key} = ?`);
    });
    await this.localDolt.db.query(oneLine`
      UPDATE ${privateProposalsTable} SET
      ${updates.join(',')} WHERE uuid = ?`,
    [...Object.values(cleanedProposal), cleanedProposal.uuid]);
    return proposal.hash || Promise.reject('Proposal hash not found');
  }

  async bulkEditPayouts(payouts: SQLPayout[]) {
    await Promise.all(payouts.map(async (payout) => {
      const treasuryVersion = DEFAULT_TREASURY_VERSION;
      const payAddress = payout?.payAddress;
      const payProject = payout?.payProject;
      const payName = payout?.payName;
      const governanceStart = payout.governanceCycleStart;
      const numberOfPayouts = payout?.numberOfPayouts;
      const amount = payout?.amount;
      const currency = 'usd';
      const payStatus = payout?.payStatus;
      await this.localDolt.queryResults(oneLine`
        UPDATE IGNORE ${payoutsTable} SET
        treasuryVersion = ?, governanceCycleStart = ?, numberOfPayouts = ?, amount = ?,
        currency = ?, payAddress = ?, payProject = ?, payStatus = ?, payName = ?
        WHERE uuidOfPayout = ?`,
      [treasuryVersion, governanceStart, numberOfPayouts, amount, currency, payAddress, payProject, payStatus, payName, payout.uuidOfPayout]);
    }));
  }

  async deleteProposal(hash: string) {
    try {
      let affectedRows = 0;
      affectedRows += (await this.queryDbResults(oneLine`DELETE FROM ${proposalsTable} WHERE uuid = '${hash}'`)).affectedRows;
      affectedRows += (await this.queryDbResults(oneLine`DELETE FROM ${payoutsTable} WHERE uuidOfProposal = '${hash}'`)).affectedRows;
      affectedRows += (await this.queryDbResults(oneLine`DELETE FROM ${transactionsTable} WHERE uuidOfProposal = '${hash}'`)).affectedRows;
      affectedRows += (await this.queryDbResults(oneLine`DELETE FROM ${reservesTable} WHERE uuidOfProposal = '${hash}'`)).affectedRows;
      affectedRows += (await this.queryDbResults(oneLine`DELETE FROM ${transfersTable} WHERE uuidOfProposal = '${hash}'`)).affectedRows;
      return affectedRows;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async deletePrivateProposal(hash: string) {
    const res = await this.queryDbResults(oneLine`DELETE FROM ${privateProposalsTable} WHERE uuid = '${hash}'`);
    return res.affectedRows;
  }

  async updateStatuses(proposals: Proposal[], status: string) {
    const uuidStringList = proposals.map((p) => { return `'${p.hash}'`; }).join(',');
    const query = `
      UPDATE ${proposalsTable} SET
      proposalStatus = '${status}'
      WHERE uuid IN (${uuidStringList})
    `;
    return this.queryDb(query);
  }

  async updateDiscussionURL(proposal: Proposal) {
    return this.queryDb(`
      UPDATE ${proposalsTable} SET
      discussionURL = '${proposal.discussionThreadURL}'
      WHERE uuid = '${proposal.hash}'
    `);
  }

  async updateStatusTemperatureCheckAndProposalId(proposal: Proposal) {
    const query = `
      UPDATE ${proposalsTable} SET
      proposalStatus = '${proposal.status}',
      proposalId = ${proposal.proposalId}
      WHERE uuid = '${proposal.hash}'
    `;
    return this.queryDb(query);
  }

  async updateStatusTemperatureCheck(proposals: Proposal[]) {
    const uuidStringList = proposals.map((p) => { return `'${p.hash}'`; }).join(',');
    const query = `
      UPDATE ${proposalsTable} SET
      proposalStatus = '${STATUS.TEMPERATURE_CHECK}'
      WHERE uuid IN (${uuidStringList})
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
    const results = this.localDolt.db.query(`
      UPDATE ${proposalsTable} SET
      title = ?, proposalStatus = ?, snapshotId = ?, ipfsCID = ? WHERE uuid = ?`,
    [proposal.title, proposal.status, proposal.voteURL, proposal.ipfsURL, proposal.hash]);
    return results;
  }

  async updateVotingClose(proposal: Proposal) {
    const voteChoices = JSON.stringify(proposal.voteResults?.choices);
    const snapshotVotes = JSON.stringify(proposal.voteResults?.scores);
    await this.localDolt.db.query(oneLine`
      UPDATE ${proposalsTable} SET
      choices = ?,
      snapshotVotes = ?,
      voteAddressCount = ?,
      proposalStatus = ?
      WHERE uuid = ?
    `, [voteChoices, snapshotVotes, proposal.voteResults?.votes, proposal.status, proposal.hash]);
    this.actionDirector(proposal);
  }

  async updatePayoutStatus(proposal: Proposal) {
    const payStatus = (proposal.status === STATUS.APPROVED) ? STATUS.ACTION.ACTIVE : STATUS.ACTION.CANCELLED;
    this.localDolt.db.query(`
      UPDATE ${payoutsTable} SET
      payStatus = ?
      WHERE uuidOfProposal = ?
  `, [payStatus, proposal.hash]);
  }

  async setStalePayouts(currentGovernanceCycle: number): Promise<number> {
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

  // ===================================== //
  // ========== get functions ============ //
  // ===================================== //

  async getToDiscuss() {
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = '${STATUS.DISCUSSION}'
      AND discussionURL IS NULL
      ORDER BY proposalId ASC
    `);
  }

  async getDiscussionProposals() {
    return this.queryProposals(`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = '${STATUS.DISCUSSION}'
      AND proposalId IS NOT NULL
      AND discussionURL IS NOT NULL
      AND title IS NOT NULL
      ORDER BY proposalId ASC
    `);
  }

  async getTemperatureCheckProposals() {
    return this.queryProposals(oneLine`
      SELECT * FROM ${proposalsTable} WHERE
      proposalStatus = '${STATUS.TEMPERATURE_CHECK}'
      ORDER BY proposalId ASC
    `);
  }

  async getVoteProposals({ uploadedToSnapshot = false } : { uploadedToSnapshot?: boolean } = {}) {
    return this.queryProposals(`
      ${SELECT_ACTIONS} from ${proposalsTable} WHERE
      proposalStatus = '${STATUS.VOTING}'
      AND snapshotId IS ${uploadedToSnapshot ? 'NOT ' : ''}NULL
      ORDER BY proposalId ASC
    `);
  }

  async getNextProposalId() {
    return this.queryDb(`
      SELECT proposalId FROM ${proposalsTable}
      ORDER BY proposalId DESC
      LIMIT 1
    `).then((res: any) => {
      if (res.length === 0) return 1;
      return Number(res[0].proposalId) + 1;
    });
  }

  async getProposals({ governanceCycle, keyword, author, limit, offset, where } :
  { governanceCycle?: string; keyword?: string; author?: string, limit?: number; offset?: number; where?: string; }) {
    const whereClauses = [];
    let selectRelevance = '';

    // Handle where
    if (where) {
      whereClauses.push(where);
    }

    // Handle governanceCycle
    if (governanceCycle) {
      whereClauses.push(this.cycleWhereClause(governanceCycle));
    }

    // Handle keyword
    if (keyword) {
      const { relevanceCalculation, orConditions } = this.relevanceMatch(keyword);
      whereClauses.push(`(${orConditions})`);
      selectRelevance = `, (${relevanceCalculation}) AS relevance`;
    }

    if (author) { whereClauses.push(`authorAddress = '${author}'`); }

    const whereStatement = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orderByStatement = keyword ? 'ORDER BY relevance DESC' : 'ORDER BY createdTime DESC';
    const pagination = (limit || offset) ? `LIMIT ${limit ? limit + 1 : limit} OFFSET ${offset}` : '';

    const query = oneLine`
      ${SELECT_ACTIONS} ${selectRelevance}
      FROM ${proposalsTable}
      ${whereStatement}
      ${orderByStatement}
      ${pagination}
    `;

    const proposals = await this.queryProposals(query);
    const hasMore = (limit) ? proposals.length > limit : false;
    if (hasMore) proposals.pop();

    return { proposals, hasMore };
  }

  // eslint-disable-next-line class-methods-use-this
  cycleWhereClause(cycle: string) {
    if (cycle.includes('All')) return '1=1';
    return `governanceCycle IN (${cycle.split('+').join(', ')})`;
  }

  // eslint-disable-next-line class-methods-use-this
  relevanceMatch(keyword: string) {
    const searchKeywords = keyword.split(' ').map((kw) => { return kw.trim(); }).filter(Boolean);
    const relevanceCalculation = searchKeywords
      .map((kw) => { return `(LOWER(body) LIKE LOWER('%${kw}%')) + 2 * (LOWER(title) LIKE LOWER('%${kw}%'))`; })
      .join(' + ');

    const orConditions = searchKeywords
      .map((kw) => { return `(LOWER(body) LIKE LOWER('%${kw}%')) OR (LOWER(title) LIKE LOWER('%${kw}%'))`; })
      .join(' OR ');

    return { relevanceCalculation, orConditions };
  }

  async getProposalByAnyId(hashOrId: string): Promise<Proposal> {
    let where = `WHERE ${proposalsTable}`;
    if (hashOrId.length === 32) {
      where = `${where}.uuid = '${hashOrId}'`;
    } else if (hashOrId.includes(this.proposalIdPrefix)) {
      const id = this.proposalIdNumber(hashOrId);
      if (!id) return Promise.reject('bad proposalId');
      where = `${where}.proposalId = ${id}`;
    } else if (hashOrId.startsWith('0x')) {
      where = `${where}.snapshotId = '${hashOrId}'`;
    } else if (Number.isInteger(Number(hashOrId))) {
      where = `${where}.proposalId = ${hashOrId}`;
    } else return Promise.reject('bad proposalId');
    return this.queryProposals(oneLine`
      ${SELECT_ACTIONS} FROM ${proposalsTable}
      ${where} LIMIT 1
    `).then((res) => {
      if (res.length === 0) return Promise.reject('proposalId not found');
      return res[0];
    }).catch((e) => { return Promise.reject(e); });
  }

  async getPrivateProposalsByAuthorAddress(authorAddress: string) {
    return this.queryProposals(oneLine`
    SELECT *, HEX(title) as title FROM ${privateProposalsTable} WHERE
    authorAddress = ?`, [authorAddress]);
  }

  async getPrivateProposal(hash: string, authorAddress: string) {
    return this.queryProposals(oneLine`
      SELECT *, HEX(body) as body, HEX(title) as title FROM ${privateProposalsTable} WHERE
      uuid = ? AND authorAddress = ?`, [hash, authorAddress]).then((res) => {
      if (res.length === 0) return Promise.reject('proposalId not found');
      return res[0];
    }).catch((e) => { return Promise.reject(e); });
  }

  async getPayoutsDb(currentGovernanceCycle: number): Promise<SQLPayout[]> {
    const treasuryVersion = 3;
    const results = this.queryDb(`
      SELECT ${payoutsTable}.*, ${proposalsTable}.authorDiscordId, ${proposalsTable}.proposalId, ${proposalsTable}.snapshotId FROM ${payoutsTable}
      LEFT JOIN ${proposalsTable} ON ${payoutsTable}.uuidOfProposal = ${proposalsTable}.uuid
      WHERE treasuryVersion = ${treasuryVersion} AND
      payStatus = '${STATUS.ACTION.ACTIVE}' AND
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
      payStatus != '${STATUS.ACTION.CANCELLED}' AND
      governanceCycleStart <= ${governanceCycle} AND
      governanceCycleStart + numberOfPayouts >= ${governanceCycle + 1}
      ORDER BY proposalId ASC
    `) as unknown as SQLPayout[];
    return results;
  }

  async getReserveDb(): Promise<SQLReserve> {
    const results = await this.queryDb(`
      SELECT * from ${reservesTable}
      WHERE id = (SELECT MAX(id) from ${reservesTable})
    `) as unknown as SQLReserve[];
    return results[0];
  }

  async getTransfersDb(currentGovernanceCycle: number): Promise<SQLTransfer[]> {
    const results = await this.queryDb(`
      SELECT * from ${transfersTable} WHERE
      transferGovernanceCycle <= ${currentGovernanceCycle} AND
      transferGovernanceCycle + transferCount >= ${currentGovernanceCycle + 1}
    `) as unknown as SQLTransfer[];
    return results;
  }

  async getTransactionsByProposalUuid(uuid: string) {
    const results = await this.queryDbResults(`
      SELECT * from ${transactionsTable} WHERE
      uuidOfProposal = ?
    `, [uuid]) as unknown as SQLCustomTransaction[];
    return results;
  }

  async getTransactionsByUuids(uuids: string[]) {
    const results = await this.queryDbResults(oneLine`
      SELECT * from ${transactionsTable} WHERE
      uuidOfTransaction IN (${uuids.map((uuid) => { return `'${uuid}'`; }).join(',')})
    `) as unknown as SQLCustomTransaction[];
    return results;
  }

  // ===================================== //
  // ========== dolt routines ============ //
  // // ===================================== //
  async insertAutoCommitAndPushEvent() {
    await this.localDolt.query('DROP PROCEDURE IF EXISTS AutoCommitAndPush');
    await this.localDolt.query(oneLine`
      CREATE PROCEDURE AutoCommitAndPush()
        BEGIN
          DECLARE hasChanges BOOLEAN DEFAULT FALSE;
          SELECT IF(COUNT(*) > 0, TRUE, FALSE) INTO hasChanges
          FROM dolt_status
          WHERE status = 'modified' OR status = 'new table';
          IF hasChanges THEN
              CALL DOLT_ADD('-A');
              CALL DOLT_COMMIT('-m', 'Automated commit message');
              CALL DOLT_PUSH('origin', 'main');
          END IF;
      END;
    `);
    await this.localDolt.query(oneLine`
      CREATE EVENT IF NOT EXISTS AutoCommitAndPushEvent
        ON SCHEDULE EVERY 10 MINUTE
        STARTS CURRENT_TIMESTAMP
        DO
          CALL AutoCommitAndPush();
    `);
  }

  async getHead(): Promise<string> {
    return this.queryDbResults(`SELECT @@${this.localDolt.options.database}_head as head`).then((res) => {
      return (res as unknown as [{ head: string }])[0].head;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }
}
