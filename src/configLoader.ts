import axios from 'axios';
import fs from 'fs';
import { DoltSysHandler } from './dolt/doltSysHandler';
import { NanceConfig } from './types';
import { pools } from './dolt/pools';

const CONFIG_ENV = process.env.CONFIG ?? '';

export async function getConfig(query?: string): Promise<NanceConfig> {
  const config = (!query) ? await import(`${__dirname}/config/${CONFIG_ENV}/${CONFIG_ENV}.json`).then((conf) => {
    return conf.default;
  }) : await import(`${__dirname}/config/${query}/${query}.json`).then((conf) => {
    return conf.default;
  });
  return config;
}

export async function doltConfig(query: string): Promise<{ config: NanceConfig, calendarText: string, spaceOwners: string[] }> {
  const dolt = new DoltSysHandler(pools.nance_sys);
  return dolt.getSpaceConfig(query).then((res) => {
    if (res) return { config: res.config, calendarText: res.calendar, spaceOwners: res.spaceOwners };
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject(`space ${query} not found`);
  });
}

export const getCalendar = (config: NanceConfig) => {
  const calendarPath = `${__dirname}/config/${config.name}/${config.name}.ics`;
  return fs.readFileSync(calendarPath, 'utf-8');
};
