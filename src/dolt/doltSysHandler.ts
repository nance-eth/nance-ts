import { oneLine } from 'common-tags';
import { DoltSQL, cleanResultsHeader } from './doltSQL';
import { dbOptions } from './dbConfig';
import { sqlSchemaToString } from '../utils';
import { NanceConfig } from '../types';
import { SpaceConfig } from './schema';

const systemDb = 'nance_sys';
const system = 'config';

export class DoltSysHandler {
  localDolt;

  constructor() {
    this.localDolt = new DoltSQL(dbOptions(systemDb));
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

  async setSpaceConfig(space: string, cid: string, spaceOwners: string[], config: NanceConfig, calendar: string) {
    return this.localDolt.queryResults(oneLine`
      INSERT INTO ${system} (space, cid, spaceOwners, config, calendar, lastUpdated)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE cid = VALUES(cid), spaceOwners = VALUES(spaceOwners), config = VALUES(config), calendar = VALUES(calendar), lastUpdated = NOW()
    `, [space, cid, JSON.stringify(spaceOwners), JSON.stringify(config), calendar]).then((res) => {
      return res.affectedRows;
    }).catch((e) => { return Promise.reject(e.sqlMessage); });
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
}
