import logger from './logging';
import { NanceConfig } from './types';

const CONFIG_ENV = process.env.CONFIG ?? '';
if (CONFIG_ENV === '') {
  logger.info('no CONFIG specify name when loading!');
}

export async function getConfig(query?: string): Promise<NanceConfig> {
  const config = (!query) ? await import(`${__dirname}/config/${CONFIG_ENV}/${CONFIG_ENV}.json`).then((conf) => {
    return conf.default;
  }) : await import(`${__dirname}/config/${query}/${query}.json`).then((conf) => {
    return conf.default;
  });
  return config;
}
