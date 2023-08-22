import { oneLine } from 'common-tags';
import { DoltSQL, cleanResultsHeader } from './doltSQL';
import { dbOptions } from './dbConfig';
import { sqlSchemaToString } from '../utils';
import { NanceConfig } from '../types';
import { DialogHandlerMessageIds, SpaceConfig } from './schema';

const systemDb = 'nance_sys';
const system = 'config';
const contracts = 'contracts';

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

  async getSpaceCID(space: string): Promise<string> {
    return this.localDolt.queryRows(oneLine`
      SELECT cid FROM ${system}
      WHERE space = ? LIMIT 1
    `, [space]).then((res) => {
      return res[0].cid;
    }).catch((e) => { return Promise.reject(e); });
  }

  async setSpaceConfig(space: string, cid: string, spaceOwners: string[], config: NanceConfig, calendar: string, cycleCurrentDay: number, cycleTriggerTime: string, cycleStageLengths: number[]) {
    return this.localDolt.queryResults(oneLine`
      INSERT INTO ${system} (
        space, cid, spaceOwners, config, calendar,
        cycleCurrentDay, cycleTriggerTime, cycleStageLengths, lastUpdated
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        cid = VALUES(cid),
        spaceOwners = VALUES(spaceOwners),
        config = VALUES(config),
        calendar = VALUES(calendar),
        cycleCurrentDay = VALUES(cycleCurrentDay),
        cycleTriggerTime = VALUES(cycleTriggerTime),
        cycleStageLengths = VALUES(cycleStageLengths),
        lastUpdated = NOW()
    `, [space, cid, JSON.stringify(spaceOwners), JSON.stringify(config), calendar, cycleCurrentDay, cycleTriggerTime, cycleStageLengths]).then((res) => {
      return res.affectedRows;
    }).catch((e) => { return Promise.reject(e.sqlMessage); });
  }

  async incrementCycleDay(space: string) {
    return this.localDolt.queryResults(oneLine`
    UPDATE ${system}
    SET cycleCurrentDay = CASE
      WHEN cycleCurrentDay + 1 >
        JSON_UNQUOTE(JSON_EXTRACT(cycleStageLengths, '$[0]')) +
        JSON_UNQUOTE(JSON_EXTRACT(cycleStageLengths, '$[1]')) +
        JSON_UNQUOTE(JSON_EXTRACT(cycleStageLengths, '$[2]')) +
        JSON_UNQUOTE(JSON_EXTRACT(cycleStageLengths, '$[3]'))
            THEN 1
        ELSE cycleCurrentDay + 1
        END
    WHERE space = ?;
    `, [space]).then((res) => {
      return res.affectedRows;
    }).catch((e) => { return Promise.reject(e); });
  }

  async updateDialogHandlerMessageId(space: string, messageName: keyof DialogHandlerMessageIds, messageId: string) {
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
    `, [space]).then((res) => {
      return res[0].dialogHandlerMessageIds;
    }).catch((e) => { return Promise.reject(e); });
  }

  async getSpaceConfig(space: string): Promise<SpaceConfig | undefined> {
    return this.localDolt.queryRows(oneLine`
      SELECT * FROM ${system}
      WHERE space = ? LIMIT 1
    `, [space]).then((res) => {
      return res[0] as unknown as SpaceConfig;
    }).catch((e) => { return Promise.reject(e); });
  }

  async getAllSpaceNames(): Promise<SpaceConfig[]> {
    return this.localDolt.queryRows(oneLine`
      SELECT * FROM ${system}`).then((res) => {
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
