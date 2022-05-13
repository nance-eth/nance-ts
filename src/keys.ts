import 'dotenv/config';
import { log } from './utils';

log(`keys environment: ${process.env.NODE_ENV}`);

export const keys = {
  DISCORD_KEY: ((process.env.NODE_ENV === 'dev') ? process.env.DISCORD_KEY_DEV : process.env.DISCORD_KEY) ?? '',
  NOTION_KEY: process.env.NOTION_KEY ?? '',
  PINATA_KEY: {
    KEY: process.env.PINATA_KEY,
    SECRET: process.env.PINATA_SECRET,
  },
  SNAPSHOT_KEY: process.env.SNAPSHOT_KEY,
  GITHUB_KEY: process.env.GITHUB_KEY ?? ''
};

export const configName = process.env.CONFIG;
