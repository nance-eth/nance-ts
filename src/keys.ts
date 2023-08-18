/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'dotenv/config';
import logger from './logging';

const requiredVariables = [
  'INFURA_KEY',
  'INFURA_IPFS_ID',
  'INFURA_IPFS_SECRET',
  'PRIVATE_KEY',
  'DOLT_KEY',
  'TENDERLY_KEY',
  'PUBLIC_ADDRESS',
  'DOLT_CERT',
  'NEXTAUTH_SECRET',
  'NANCE_AUTO_KEY',
];

const missingVariables = requiredVariables.filter((variable) => { return !process.env[variable]; });

if (missingVariables.length > 0) {
  console.error(`Missing environment variable(s): ${missingVariables.join(', ')}`);
  process.exit(1);
}

export const keys = {
  PROVIDER_KEY: process.env.PROVIDER_KEY!,
  INFURA_KEY: process.env.INFURA_KEY!,
  INFURA_IPFS_ID: process.env.INFURA_IPFS_ID,
  INFURA_IPFS_SECRET: process.env.INFURA_IPFS_SECRET!,
  PRIVATE_KEY: process.env.PRIVATE_KEY!,
  DOLT_KEY: process.env.DOLT_KEY!,
  TENDERLY_KEY: process.env.TENDERLY_KEY!,
  ETHERSCAN_KEY: process.env.ETHERSCAN_KEY!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
};

export const nanceAddress = process.env.PUBLIC_ADDRESS!;
export const DOLT_CERT = process.env.DOLT_CERT!;

export const { NANCE_AUTO_KEY } = process.env;

logger.info(`DOLT_HOST: ${process.env.DOLT_HOST!}`);
