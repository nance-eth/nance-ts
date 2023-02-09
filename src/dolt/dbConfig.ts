import 'dotenv/config';
import { DBConfig } from './types';

export const dbOptions = (repo: string): DBConfig => {
  return {
    database: repo,
    host: process.env.DOLT_HOST,
    port: Number(process.env.DOLT_PORT),
    user: process.env.DOLT_USER,
    password: process.env.DOLT_PASSWORD
  };
};
