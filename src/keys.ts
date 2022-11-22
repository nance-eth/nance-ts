import 'dotenv/config';
import logger from './logging';

logger.info(`keys environment: ${process.env.NODE_ENV}`);

export const keys = {
  PINATA_KEY: {
    KEY: process.env.PINATA_KEY ?? '',
    SECRET: process.env.PINATA_SECRET ?? '',
  },
  PROVIDER_KEY: process.env.PROVIDER_KEY ?? '',
  INFURA_KEY: process.env.INFURA_KEY ?? '',
  DEEPL_KEY: process.env.DEEPL_KEY ?? '',
  PRIVATE_KEY: process.env.PRIVATE_KEY ?? '',
  GITHUB_KEY: process.env.GITHUB_KEY ?? '',
  DOLT_KEY: process.env.DOLT_KEY ?? ''
};
