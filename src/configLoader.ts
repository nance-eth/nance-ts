import axios from 'axios';
import { DoltSysHandler } from './dolt/doltSysHandler';
import { NanceConfig } from './types';
import { cidToLink } from './utils';

const CONFIG_ENV = process.env.CONFIG ?? '';
export const DEFAULT_GATEWAY = process.env.IPFS_GATEWAY ?? 'ipfs.nftstorage.link';

export async function getConfig(query?: string): Promise<NanceConfig> {
  const config = (!query) ? await import(`${__dirname}/config/${CONFIG_ENV}/${CONFIG_ENV}.json`).then((conf) => {
    return conf.default;
  }) : await import(`${__dirname}/config/${query}/${query}.json`).then((conf) => {
    return conf.default;
  });
  return config;
}

export async function cidConfig(query: string): Promise<{ config: NanceConfig, calendar: string }> {
  const dolt = new DoltSysHandler();
  const configCID = await dolt.getSpaceCID(query);
  return axios.get(cidToLink(configCID, DEFAULT_GATEWAY)).then((res) => {
    return { config: res.data.config, calendar: res.data.calendar };
  });
}

export const calendarPath = (config: NanceConfig) => {
  return `${__dirname}/config/${config.name}/${config.name}.ics`;
};
