import logger from './logging';

const CONFIG_ENV = process.env.CONFIG ?? '';
if (CONFIG_ENV === '') {
  logger.info('Specify CONFIG!');
  process.exit();
}
const configPath = `${__dirname}/config/${CONFIG_ENV}/config.${CONFIG_ENV}`;
export const calendarPath = `${__dirname}/config/${CONFIG_ENV}/${CONFIG_ENV}.ics`;

export async function getConfig() {
  const config = await import(configPath).then((conf) => {
    return conf.default;
  });
  return config;
}
