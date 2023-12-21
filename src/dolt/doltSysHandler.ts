import { oneLine } from 'common-tags';
import { DoltSQL, cleanResultsHeader } from './doltSQL';
import { dbOptions } from './dbConfig';
import { sqlSchemaToString } from '../utils';
import { DateEvent, NanceConfig } from '../types';
import { DialogHandlerMessageIds, SpaceConfig } from './schema';

const systemDb = 'nance_sys';
const system = 'config';
const contracts = 'contracts';

const defaultDialogHandlerMessageIds: DialogHandlerMessageIds = {
  voteRollup: '',
  voteEndAlert: '',
  voteQuorumAlert: '',
  voteResultsRollup: '',
  temperatureCheckRollup: '',
  temperatureCheckEndAlert: '',
  temperatureCheckStartAlert: ''
};

const defaultGovernanceCycle = 1;

export class DoltSysHandler {
  localDolt;

  constructor(
    localDolt: DoltSQL,
  ) {
    this.localDolt = localDolt;
  }

  async createSpaceDB(space: string): Promise<number> {
    return this.localDolt.db.query(oneLine`
      CREATE DATABASE ${space}
    `).then((res) => {
      return cleanResultsHeader(res);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async createSchema(space: string) {
    const schema = sqlSchemaToString();
    const newDB = new DoltSQL(dbOptions(space));
    Promise.all(schema.map(async (s) => {
      return newDB.db.query(s);
    }));
  }

  async showDatabases() {
    return this.localDolt.query('SHOW DATABASES').then((res) => {
      return (res as unknown as { Database: string }[]).map((db) => {
        return db.Database;
      }).filter((db) => { return db !== 'mysql' && db !== 'information_schema' && db !== systemDb; }); // remove system databases
    }).catch((e) => { return Promise.reject(e); });
  }

  async setSpaceConfig(
    space: string,
    displayName: string,
    cid: string,
    spaceOwners: string[],
    config: NanceConfig,
    calendar: DateEvent[],
    cycleTriggerTime: string,
    cycleStageLengths: number[],
  ) {
    return this.localDolt.queryResults(oneLine`
      INSERT INTO ${system} (
        space,
        displayName,
        cid,
        spaceOwners,
        config,
        calendar,
        cycleTriggerTime,
        cycleStageLengths,
        dialogHandlerMessageIds,
        currentGovernanceCycle,
        lastUpdated
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        cid = VALUES(cid),
        displayName = VALUES(displayName),
        spaceOwners = VALUES(spaceOwners),
        config = VALUES(config),
        calendar = VALUES(calendar),
        cycleTriggerTime = VALUES(cycleTriggerTime),
        cycleStageLengths = VALUES(cycleStageLengths),
        lastUpdated = NOW()
    `, [
      space,
      displayName,
      cid,
      JSON.stringify(spaceOwners),
      JSON.stringify(config),
      JSON.stringify(calendar),
      cycleTriggerTime,
      JSON.stringify(cycleStageLengths),
      JSON.stringify(defaultDialogHandlerMessageIds),
      defaultGovernanceCycle,
    ]).then((res) => {
      return res.affectedRows;
    }).catch((e) => { return Promise.reject(e); });
  }

  async incrementGovernanceCycle(space: string) {
    const query = oneLine`
      UPDATE ${system}
      SET currentGovernanceCycle = currentGovernanceCycle + 1
      WHERE space = ?;
    `;
    return this.localDolt.queryResults(query, [space.toLowerCase()]).then((res) => {
      return res.affectedRows;
    }).catch((e) => { return Promise.reject(e); });
  }

  async updateDialogHandlerMessageId(space: string, messageName: string, messageId: string) {
    return this.localDolt.queryResults(oneLine`
    UPDATE ${system}
    SET dialogHandlerMessageIds = JSON_SET(dialogHandlerMessageIds, '$.${messageName}', ?)
    WHERE space = ?;
    `, [messageId, space]).then((res) => {
      return res.affectedRows;
    }).catch((e) => { return Promise.reject(e); });
  }

  async getDialogHandlerMessageIds(space: string): Promise<DialogHandlerMessageIds> {
    return this.localDolt.queryRows(oneLine`
    SELECT dialogHandlerMessageIds FROM ${system}
    WHERE space = ? LIMIT 1
    `, [space.toLowerCase()]).then((res) => {
      return res[0].dialogHandlerMessageIds;
    }).catch((e) => { return Promise.reject(e); });
  }

  async getSpaceConfig(space: string): Promise<SpaceConfig> {
    return this.localDolt.queryRows(oneLine`
      SELECT * FROM ${system}
      WHERE space = LOWER(?) LIMIT 1
    `, [space.toLowerCase()]).then((res) => {
      return res[0] as unknown as SpaceConfig;
    }).catch((e) => { return Promise.reject(e); });
  }

  async getAllSpaceNames(where?: string): Promise<SpaceConfig[]> {
    return this.localDolt.queryRows(oneLine`
      SELECT * FROM ${system}
      ${(where) ? `WHERE ${where}` : ''}
      `).then((res) => {
      return res as unknown as SpaceConfig[];
    }).catch((e) => { return Promise.reject(e); });
  }

  async writeContractData(symbol: string, type: string, address: string, abi: any[]) {
    return this.localDolt.queryResults(oneLine`
      INSERT INTO ${contracts} (symbol, contractType, contractAddress, contractAbi)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE contractAddress = VALUES(contractAddress), contractAbi = VALUES(contractAbi)
    `, [symbol, type, address, JSON.stringify(abi)]).then((res) => {
      return res;
    });
  }

  async getABI(symbol: string): Promise<string> {
    return this.localDolt.queryRows(oneLine`
      SELECT contractAbi FROM ${contracts}
      WHERE symbol = ? LIMIT 1
    `, [symbol]).then((res) => {
      return res[0].contractAbi;
    });
  }
}
