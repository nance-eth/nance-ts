import logger from './logging';
import { NanceConfig } from './types';

const CONFIG_ENV = process.env.CONFIG ?? '';
if (CONFIG_ENV === '') {
  logger.info('no CONFIG specify name when loading!');
}
const configPath = `${__dirname}/config/${CONFIG_ENV}/config.${CONFIG_ENV}`;
export const calendarPath = `${__dirname}/config/${CONFIG_ENV}/${CONFIG_ENV}.ics`;

export async function getConfig(query?: string): Promise<NanceConfig> {
  const config = (!query) ? await import(configPath).then((conf) => {
    return conf.default;
  }) : await import(`${__dirname}/config/${query}/config.${query}`).then((conf) => {
    return conf.default;
  });
  return config;
}
