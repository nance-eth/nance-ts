import 'dotenv/config';
import { DBConfig } from './types';
import { DOLT_CERT } from '../keys';

const dbOptionsHosted = (repo: string): DBConfig => {
  return {
    database: repo,
    host: process.env.DOLT_HOST,
    port: Number(process.env.DOLT_PORT),
    user: process.env.DOLT_USER,
    password: process.env.DOLT_PASSWORD,
    ssl: {
      rejectUnauthorized: true,
      ca: DOLT_CERT,
    }
  };
};

const dbOptionsTEST = (repo: string): DBConfig => {
  return {
    database: repo,
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 3306,
  };
};

export const dbOptions = (repo: string): DBConfig => {
  return (process.env.TEST) ? dbOptionsTEST(repo) : dbOptionsHosted(repo);
};
