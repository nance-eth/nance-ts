export type DBConfig = {
  host?: string;
  user?: string;
  password?: string;
  port?: number;
  database?: string;
  ssl?: { rejectUnauthorized: boolean; ca: string };
};

export type DoltBranch = {
  name: string;
  hash: string;
  latest_commiter: string;
  latest_commit_date: Date;
  latest_commit_message: string;
};
