import { DoltSQL } from './doltSQL';
import { DBConfig } from './types';

const system = 'config';

export class DoltSysHandler {
  localDolt;

  constructor(
    options: DBConfig,
  ) {
    this.localDolt = new DoltSQL(options);
  }

  getSpaceCID(space: string) {
    this.localDolt.db.query(`
      SELECT cid FROM ${system}
      WHERE space = ?
    `, [space]);
  }

  setSpaceCID(space: string, cid: string) {
    this.localDolt.db.query(`
      INSERT INTO ${system} (space, cid)
      VALUES (?,?)
      ON DUPLICATE KEY UPDATE cid = VALUES(cid)
    `, [space, cid]);
  }
}
