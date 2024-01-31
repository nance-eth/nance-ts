/* eslint-disable @typescript-eslint/quotes */
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2';
import { DBConfig, DoltBranch } from './types';

export const resStatus = (res: any): number => {
  return (<RowDataPacket>res[0])[0].status;
};

export const cleanSingleRes = (res: any) => {
  return (<RowDataPacket>res[0])[0];
};

export const cleanResultsHeader = (res: any) => {
  return (<ResultSetHeader>res[0]).affectedRows;
};
export class DoltSQL {
  db;
  options;
  constructor(
    options: DBConfig,
  ) {
    this.options = options;
    this.db = mysql.createPool(options).promise();
  }

  async addRemote(remote: string, remoteName = 'origin'): Promise<boolean> {
    return this.db.query(`CALL DOLT_REMOTE('add', ?, ?)`, [remoteName, remote]).then((res) => {
      return resStatus(res) === 0;
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
      return resStatus(res);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async deleteBranch(branch: string) {
    return this.db.query(`CALL DOLT_BRANCH('-d', '${branch}')`).then((res) => {
      return resStatus(res);
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

  async commit(message: string, table?: string): Promise<string> {
    await this.db.query(`CALL DOLT_ADD(${table ? '?' : '"-A"'})`, [table]);
    return this.db.query(`CALL DOLT_COMMIT('-m', '${message}')`).then((res) => {
      return cleanSingleRes(res).hash;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async push(firstPush = false, branch = 'main'): Promise<boolean> {
    return this.db.query(`CALL DOLT_PUSH(${firstPush ? '\'--force\', ' : ''}'origin', ?)`, [branch]).then((res) => {
      return cleanSingleRes(res).success === 1;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async merge(branch: string) {
    return this.db.query(`CALL DOLT_MERGE('${branch}')`).then((res) => {
      return resStatus(res);
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

  async queryRows(query: string, variables?: string[]) {
    return this.db.query(query, variables).then((res) => {
      return res[0] as RowDataPacket[];
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async queryResults(query: string, variables?: (number | number[] | string | undefined)[]) {
    return this.db.query(query, variables).then((res) => {
      return res[0] as unknown as ResultSetHeader;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async changes(table?: string): Promise<boolean> {
    return this.db.query(`SELECT status from dolt_status${(table) ? ' WHERE table_name = ?' : ''}`, [table]).then((res) => {
      const { status } = cleanSingleRes(res);
      return status === 'modified' || status === 'new table';
    }).catch((e) => { return false; });
  }
}
