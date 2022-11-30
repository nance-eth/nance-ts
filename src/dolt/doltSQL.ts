/* eslint-disable @typescript-eslint/quotes */
import mysql, { RowDataPacket } from 'mysql2';
import { DBConfig, DoltBranch } from './types';

// DB DEFAULTS
const HOST = '127.0.0.1';
const USER = 'root';
const PASSWORD = '';

const status = (res: any) => {
  return (<RowDataPacket>res[0])[0].status;
};

const clean = (res: any) => {
  return (<RowDataPacket>res[0])[0];
};
export class DoltSQL {
  private db;
  constructor(
    options: DBConfig,
  ) {
    const { host = HOST, user = USER, password = PASSWORD, database } = options;
    this.db = mysql.createPool({ host, user, password, database }).promise();
  }

  async testConnection() {
    return this.db.getConnection().then((res) => {
      return res.config.database;
    }).catch((e) => {
      throw Error(e);
    });
  }

  async viewRemotes(): Promise<string[]> {
    return this.db.query('SELECT * FROM dolt_remotes').then((res) => {
      return (<RowDataPacket[]>res[0]).map((remote: any) => { return remote.url; });
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async createBranch(newBranch: string, fromBranch = 'main') {
    return this.db.query(`CALL DOLT_BRANCH('${newBranch}', '${fromBranch}')`).then((res) => {
      return status(res[0]);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async deleteBranch(branch: string) {
    return this.db.query(`CALL DOLT_BRANCH('-d', '${branch}')`).then((res) => {
      return status(res);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async showBranches(): Promise<DoltBranch[]> {
    return this.db.query('SELECT * from DOLT_BRANCHES').then((res) => {
      return res[0] as DoltBranch[];
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async checkout(branch: string): Promise<string> {
    return this.db.query(`CALL DOLT_CHECKOUT('${branch}')`).then((res) => {
      return status(res);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async showActiveBranch(): Promise<string> {
    return this.db.query('SELECT active_branch()').then((res) => {
      return clean(res)['active_branch()'];
    }).catch((e) => {
      return Promise.reject(e);
    });
  }
}
