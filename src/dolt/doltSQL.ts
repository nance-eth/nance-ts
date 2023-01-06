/* eslint-disable @typescript-eslint/quotes */
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2';
import { DBConfig, DoltBranch } from './types';

// DB DEFAULTS
const HOST = '127.0.0.1';
const USER = 'root';
const PASSWORD = '';
const PORT = 3306;

const status = (res: any): number => {
  return (<RowDataPacket>res[0])[0].status;
};

const cleanSingleRes = (res: any) => {
  return (<RowDataPacket>res[0])[0];
};
export class DoltSQL {
  db;
  options;
  constructor(
    options: DBConfig,
  ) {
    this.options = options;
    const { host = HOST, user = USER, password = PASSWORD, database, port = PORT } = options;
    this.db = mysql.createPool({ host, user, password, database, port }).promise();
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

  async checkout(branch: string, dash_b?: boolean) {
    return this.db.query(`CALL DOLT_CHECKOUT(${(dash_b) ? `'-b',` : ''}'${branch}')`).then((res) => {
      return cleanSingleRes(res).hash;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async add(tables = '-A'): Promise<string> {
    return this.db.query(`CALL DOLT_ADD('${tables}')`).then((res) => {
      return cleanSingleRes(res).hash;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async commit(message: string): Promise<string> {
    return this.db.query(`CALL DOLT_COMMIT('-a', '-m', '${message}')`).then((res) => {
      return cleanSingleRes(res).hash;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async push(branch: string) {
    return this.db.query(`CALL DOLT_PUSH('origin', '${branch}')`).then((res) => {
      return cleanSingleRes(res).success;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async merge(branch: string) {
    return this.db.query(`CALL DOLT_MERGE('${branch}')`).then((res) => {
      return status(res);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async showActiveBranch(): Promise<string> {
    return this.db.query('SELECT active_branch()').then((res) => {
      return cleanSingleRes(res)['active_branch()'];
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async query(query: string) {
    return this.db.query(query).then((res) => {
      return res[0];
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async queryRows(query: string) {
    return this.db.query(query).then((res) => {
      return res[0] as RowDataPacket[];
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async queryResults(query: string) {
    return this.db.query(query).then((res) => {
      return res[0] as unknown as ResultSetHeader;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }
}
