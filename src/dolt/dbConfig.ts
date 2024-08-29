import 'dotenv/config';
import { DBConfig } from './types';
import { DOLT_CERT } from '../keys';

const isLocal = process.env.LOCAL_DB;

const config = isLocal ? {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
} : {
  host: process.env.DOLT_HOST,
  port: Number(process.env.DOLT_PORT),
  user: process.env.DOLT_USER,
  password: process.env.DOLT_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ca: DOLT_CERT,
  }
};

if (isLocal) {
  console.log("[DATABASE] local");
} else {
  console.log(`[DATABASE] ${process.env.DOLT_HOST}`);
}

export const dbOptions = (repo: string): DBConfig => {
  return {
    database: repo,
    ...config,
  };
};
