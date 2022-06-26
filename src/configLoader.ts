import logger from './logging';

const CONFIG_ENV = process.env.CONFIG ?? '';
if (CONFIG_ENV === '') {
  logger.info('Specify CONFIG!');
  process.exit();
}
const configPath = `${__dirname}/config/${CONFIG_ENV}/config.${CONFIG_ENV}`;

async function getConfig() {
  const config = await import(configPath).then((conf) => {
    return conf.default;
  });
  return config;
}

getConfig();

export default getConfig;
