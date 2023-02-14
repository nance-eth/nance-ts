import { DoltSQL } from './doltSQL';
import { dbOptions } from './dbConfig';

const systemDb = 'nance_sys';
const system = 'config';

export class DoltSysHandler {
  localDolt;

  constructor() {
    this.localDolt = new DoltSQL(dbOptions(systemDb));
  }

  async createSpaceDB(space: string) {
    return this.localDolt.db.query(`
      CREATE DATABASE ${space}
    `);
  }

  async getSpaceCID(space: string): Promise<string> {
    return this.localDolt.queryRows(`
      SELECT cid FROM ${system}
      WHERE space = ? LIMIT 1
    `, [space]).then((res) => {
      return res[0].cid;
    }).catch((e) => { return Promise.reject(e); });
  }

  async setSpaceCID(space: string, cid: string) {
    this.localDolt.db.query(`
      INSERT INTO ${system} (space, cid)
      VALUES (?,?)
      ON DUPLICATE KEY UPDATE cid = VALUES(cid)
    `, [space, cid]);
  }
}
