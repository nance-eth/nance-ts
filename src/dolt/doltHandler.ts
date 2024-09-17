/* eslint-disable max-lines */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-param-reassign */
import { oneLine } from 'common-tags';
import { omitBy, isNil } from 'lodash';
import {
  getActionsFromBody,
  Proposal,
  SQLProposal,
  ProposalStatus,
  PollResults,
  Action,
  ActionTracking,
  ActionStatus,
} from '@nance/nance-sdk';
import { DoltSQL } from './doltSQL';
import { IPFS_GATEWAY, isHexString } from '../utils';
import { SELECT_ACTIONS } from './queries';

const proposalsTable = 'proposals';
const pollsTable = 'polls';

// we are mixing abstracted and direct db queries, use direct mysql2 queries when there are potential NULL values in query
export class DoltHandler {
  localDolt;
  proposalIdPrefix?;

  constructor(
    localDolt: DoltSQL,
    proposalIdPrefix?: string
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

  async queryProposals(query: string, variables?: any[]): Promise<Proposal[]> {
    return this.localDolt.queryRows(query, variables).then((res) => {
      return res.map((r) => {
        return this.toProposal(r as SQLProposal);
      });
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async queryDbResults(query: string, variables?: (string | number | boolean | undefined | null)[]) {
    return this.localDolt.queryResults(query, variables).then((res) => {
      return res;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  toProposal(proposal: SQLProposal): Proposal {
    const title = isHexString(proposal.title) ? Buffer.from(proposal.title, 'hex').toString('utf8') : proposal.title;
    const body = isHexString(proposal.body) ? Buffer.from(proposal.body, 'hex').toString('utf8') : proposal.body;
    const actions = (): Action[] => {
      const oldActions = proposal.actions ? JSON.parse(proposal.actions as unknown as string).flat(2) as Action[] : [];
      const _actions = oldActions.length > 0 ? oldActions : getActionsFromBody(body);
      if (_actions && _actions.length > 0) {
        // merge with actionStatus
        return _actions.map((a, i) => {
          return {
            ...a,
            actionTracking: proposal?.actionTracking?.[i],
          };
        });
      }
      return [];
    };
    const cleanProposal: Proposal = {
      uuid: proposal.uuid,
      title,
      body,
      status: proposal.proposalStatus as ProposalStatus,
      proposalId: proposal.proposalId,
      discussionThreadURL: proposal.discussionURL ?? '',
      ipfsURL: proposal.ipfsCID ? `${IPFS_GATEWAY}/ipfs/${proposal.ipfsCID}` : undefined,
      voteURL: proposal.snapshotId ? proposal.snapshotId : undefined,
      createdTime: proposal.createdTime.toISOString(),
      lastEditedTime: proposal.lastEditedTime.toISOString(),
      governanceCycle: proposal.governanceCycle,
      authorAddress: proposal.authorAddress,
      coauthors: proposal.coauthors ? proposal.coauthors : undefined,
      actions: actions(),
    };
    // thread summaries
    if (proposal?.proposalSummary) {
      cleanProposal.proposalSummary = proposal.proposalSummary;
    }
    if (proposal.threadSummary) {
      cleanProposal.threadSummary = proposal.threadSummary;
    }
    // vote type
    if (proposal.voteType !== 'basic') {
      cleanProposal.voteSetup = {
        type: proposal.voteType,
        choices: proposal.choices
      };
    }
    // snapshot votes
    if (proposal.snapshotVotes) {
      cleanProposal.voteResults = {
        choices: proposal.choices,
        scores: proposal.snapshotVotes,
        votes: proposal.voteAddressCount,
        scoresTotal: proposal.snapshotVotes.reduce((a, b) => a + b, 0),
        quorumMet: false, // we dont have this data in the db
      };
    }
    // temperature check votes
    if (proposal.temperatureCheckVotes) {
      cleanProposal.temperatureCheckVotes = proposal.temperatureCheckVotes;
    }
    return cleanProposal;
  }

  // eslint-disable-next-line class-methods-use-this
  toSQLProposal(proposal: Partial<Proposal>): Partial<SQLProposal> {
    const sqlProposal = {
      uuid: proposal.uuid,
      title: proposal.title || undefined,
      body: proposal.body || undefined,
      proposalStatus: proposal.status,
      proposalId: proposal.proposalId || undefined,
      snapshotId: proposal.voteURL || undefined,
      discussionURL: proposal.discussionThreadURL || undefined,
      governanceCycle: proposal.governanceCycle || undefined,
      authorAddress: proposal.authorAddress || undefined,
      coauthors: JSON.stringify(proposal.coauthors) || undefined,
    };
    return omitBy(sqlProposal, isNil);
  }

  // eslint-disable-next-line class-methods-use-this
  toBlindYesNoResults(polls: { answer: boolean }[]): PollResults {
    const yes = polls.filter((a) => a.answer).map(() => "unknown");
    const no = polls.filter((a) => !a.answer).map(() => "unknown");
    return { voteYesUsers: yes, voteNoUsers: no, unverifiedUsers: [] };
  }

  proposalIdNumber = (proposalId: string): number | null => {
    if (!this.proposalIdPrefix) return null;
    const value = Number(proposalId.split(this.proposalIdPrefix)[1]);
    return (Number.isNaN(value)) ? null : value;
  };

  // ===================================== //
  // ========== add functions ============ //
  // ===================================== //

  async addProposalToDb(proposal: Proposal, receipt?: string) {
    const now = new Date().toISOString();
    await this.localDolt.db.query(oneLine`
      INSERT INTO ${proposalsTable} (
        uuid,
        createdTime,
        lastEditedTime,
        title,
        body,
        authorAddress,
        authorDiscordId,
        governanceCycle,
        proposalStatus,
        proposalId,
        discussionURL,
        voteType,
        choices,
        snapshotVotes,
        snapshotId,
        voteAddressCount,
        signature,
        coauthors
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      proposal.uuid,
      proposal.createdTime || now,
      now,
      proposal.title,
      proposal.body,
      proposal.authorAddress,
      proposal.authorDiscordId,
      proposal.governanceCycle,
      proposal.status,
      proposal.proposalId,
      proposal.discussionThreadURL,
      proposal.voteSetup?.type,
      JSON.stringify(proposal.voteSetup?.choices),
      JSON.stringify(proposal.voteResults?.scores),
      proposal.voteURL,
      proposal.voteResults?.votes,
      receipt,
      JSON.stringify(proposal.coauthors),
    ]);
    return { uuid: proposal.uuid, proposalId: proposal.proposalId };
  }

  // ===================================== //
  // ====== edit/update functions ======== //
  // ===================================== //

  async editProposal(proposal: Partial<Proposal>, receipt?: string) {
    const updates: string[] = [];
    const cleanedProposal = this.toSQLProposal(proposal);
    if (!cleanedProposal.uuid) return Promise.reject('Proposal uuid not found');
    cleanedProposal.lastEditedTime = new Date();
    Object.keys(cleanedProposal).forEach((key) => {
      updates.push(`${key} = ?`);
    });
    if (receipt) updates.push("signature = ?");
    const query = `UPDATE ${proposalsTable} SET ${updates.join(',')} WHERE uuid = ?`;
    const vars = [...Object.values(cleanedProposal)];
    if (receipt) vars.push(receipt);
    vars.push(cleanedProposal.uuid);
    await this.localDolt.db.query(query, vars);
    return proposal.uuid || Promise.reject('Proposal uuid not found');
  }

  async deleteProposal(uuid: string) {
    try {
      return (
        await this.queryDbResults(oneLine`DELETE FROM ${proposalsTable} WHERE uuid = '${uuid}'`)
      ).affectedRows;
    } catch (e) {
      throw new Error(`Error deleting proposal: ${e}`);
    }
  }

  async updateStatuses(proposals: Proposal[], status: ProposalStatus) {
    const uuidStringList = proposals.map((p) => { return `'${p.uuid}'`; }).join(',');
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
      WHERE uuid = '${proposal.uuid}'
    `);
  }

  async updateTemperatureCheckClose(proposal: Proposal) {
    const query = `
      UPDATE ${proposalsTable} SET
      temperatureCheckVotes = '[${proposal.temperatureCheckVotes}]',
      proposalStatus = '${proposal.status}',
      title = '${proposal.title}'
      WHERE uuid = '${proposal.uuid}'
    `;
    return this.queryDb(query);
  }

  async updateVotingSetup(proposal: Proposal) {
    const results = this.localDolt.db.query(`
      UPDATE ${proposalsTable} SET
      title = ?, proposalStatus = ?, snapshotId = ?, ipfsCID = ? WHERE uuid = ?`,
    [proposal.title, proposal.status, proposal.voteURL, proposal.ipfsURL, proposal.uuid]);
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
    `, [voteChoices, snapshotVotes, proposal.voteResults?.votes, proposal.status, proposal.uuid]);
  }

  async updateSummary(uuid: string, summary: string, type: "proposal" | "thread") {
    return this.localDolt.db.query(oneLine`
      UPDATE ${proposalsTable} SET
      ${type}Summary = ?
      WHERE uuid = ?
    `, [summary, uuid]);
  }

  async updateActionTracking(uuid: string, actionTracking: ActionTracking[][] | null) {
    const value = actionTracking ? JSON.stringify(actionTracking) : null;
    return this.queryDbResults(oneLine`
      UPDATE ${proposalsTable} SET
      actionTracking = ?
      WHERE uuid = ?
    `, [value, uuid]).then((res) => {
      return res.affectedRows;
    })
  }

  // ===================================== //
  // ========== get functions ============ //
  // ===================================== //

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

  async getProposals({
    governanceCycle,
    keyword,
    author,
    limit,
    offset,
    status,
    actionTrackingStatus,
  } : {
    governanceCycle?: string | number;
    keyword?: string;
    author?: string;
    limit?: number;
    offset?: number;
    status?: ProposalStatus[]
    actionTrackingStatus?: ActionStatus[];
  }) {
    const whereClauses = [];
    let selectRelevance = '';

    // Handle governanceCycle
    if (governanceCycle) {
      whereClauses.push(this.cycleWhereClause(String(governanceCycle)));
    }

    // Handle actionTrackingStatus
    if (actionTrackingStatus && actionTrackingStatus.length > 0) {
      const actionTrackingConditions = actionTrackingStatus.map((s) => {
        return `JSON_SEARCH(actionTracking, 'all', '${s}', NULL, '$[*][*].status') IS NOT NULL`;
      }).join(' OR ');
      whereClauses.push(`actionTracking IS NOT NULL AND (${actionTrackingConditions})`);
    }

    // Handle keyword
    if (keyword) {
      const { relevanceCalculation, orConditions } = this.relevanceMatch(keyword);
      whereClauses.push(`(${orConditions})`);
      selectRelevance = `, (${relevanceCalculation}) AS relevance`;
    }

    if (author) { whereClauses.push(`authorAddress = '${author}'`); }
    if (status && status.length > 0) {
      const statusConditions = status.map((s) => `proposalStatus = '${s}'`).join(' OR ');
      whereClauses.push(`(${statusConditions})`);
    }

    const whereStatement = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orderByStatement = keyword ? 'ORDER BY relevance DESC' : 'ORDER BY createdTime DESC';
    const pagination = (limit || offset) ? `LIMIT ${limit ? limit + 1 : limit} OFFSET ?` : '';

    const query = oneLine`
      ${SELECT_ACTIONS} ${selectRelevance}
      FROM ${proposalsTable}
      ${whereStatement}
      ${orderByStatement}
      ${pagination}
    `;
    const proposals = await this.queryProposals(query, [offset]);
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

  async getProposalByAnyId(uuidOrId: string): Promise<Proposal> {
    let where = `WHERE ${proposalsTable}`;
    if (uuidOrId.length === 32) {
      where = `${where}.uuid = '${uuidOrId}'`;
    } else if (this.proposalIdPrefix && uuidOrId.includes(this.proposalIdPrefix)) {
      const id = this.proposalIdNumber(uuidOrId);
      if (!id) return Promise.reject('bad proposalId');
      where = `${where}.proposalId = ${id}`;
    } else if (uuidOrId.startsWith('0x')) {
      where = `${where}.snapshotId = '${uuidOrId}'`;
    } else if (Number.isInteger(Number(uuidOrId))) {
      where = `${where}.proposalId = ${uuidOrId}`;
    } else return Promise.reject('bad proposalId');
    return this.queryProposals(oneLine`
      ${SELECT_ACTIONS} FROM ${proposalsTable}
      ${where} LIMIT 1
    `).then((res) => {
      return res[0];
    }).catch((e) => { return Promise.reject(e); });
  }

  async getProposalByThreadURL(url: string): Promise<Proposal> {
    return this.queryProposals(oneLine`
      SELECT * FROM ${proposalsTable}
      WHERE discussionURL = '${url}' LIMIT 1
    `).then((res) => {
      return res[0];
    }).catch((e) => { return Promise.reject(e); });
  }

  async getProposalByActionId(aid: string) {
    return this.queryProposals(oneLine`
      SELECT *
      FROM proposals
      WHERE body LIKE CONCAT('%uuid: ', ?, '%')
        AND body LIKE '%\`\`\`nance-actions%'
      LIMIT 1
    `, [aid]).then((res) => {
      return res[0];
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async insertPoll({ id, uuidOfProposal, answer }: { id: string; uuidOfProposal: string; answer: boolean }) {
    const now = new Date().toISOString();
    return this.queryDbResults(oneLine`
      INSERT INTO ${pollsTable}
        (id, uuidOfProposal, answer, createdTime, updatedTime) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        answer = VALUES(answer), updatedTime = VALUES(updatedTime)
    `, [id, uuidOfProposal, answer, now, now]);
  }

  async getPollsByProposalUuid(uuid: string) {
    try {
      const answers = await this.queryDbResults(oneLine`
        SELECT answer from ${pollsTable} WHERE
        uuidOfProposal = ?
      `, [uuid]) as unknown as { answer: boolean }[];
      return this.toBlindYesNoResults(answers);
    } catch (e) {
      console.log(e);
      // table doesn't exist, kinda hacky
      return undefined;
    }
  }

  // ===================================== //
  // ========== dolt routines ============ //
  // ===================================== //
  async checkAndPush(table?: string, message = 'auto commit'): Promise<string> {
    // call push in case we committed but push failed before
    await this.localDolt.push();
    if (await this.localDolt.changes(table)) {
      return this.localDolt.commit(message).then(async (res) => {
        if (res) {
          return this.localDolt.push().then(() => {
            return res; // commit uuid
          });
        }
        return Promise.reject("dolthub push error");
      }).catch((e) => {
        return Promise.reject(e);
      });
    }
    return Promise.reject("no changes");
  }

  async getHead(): Promise<string> {
    return this.queryDbResults(`SELECT @@${this.localDolt.options.database}_head as head`).then((res) => {
      return (res as unknown as [{ head: string }])[0].head;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }
}
