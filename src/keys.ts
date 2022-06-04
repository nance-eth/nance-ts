import 'dotenv/config';
import logger from './logging';

logger.info(`keys environment: ${process.env.NODE_ENV}`);

export const keys = {
  DISCORD_KEY: ((process.env.NODE_ENV === 'dev') ? process.env.DISCORD_KEY_DEV : process.env.DISCORD_KEY) ?? '',
  NOTION_KEY: ((process.env.NODE_ENV === 'dev') ? process.env.NOTION_KEY_DEV : process.env.NOTION_KEY) ?? '',
  PINATA_KEY: {
    KEY: process.env.PINATA_KEY ?? '',
    SECRET: process.env.PINATA_SECRET ?? '',
  },
  PROVIDER_KEY: process.env.PROVIDER_KEY ?? '',
  PRIVATE_KEY: process.env.PRIVATE_KEY ?? '',
  GITHUB_KEY: process.env.GITHUB_KEY ?? ''
};
