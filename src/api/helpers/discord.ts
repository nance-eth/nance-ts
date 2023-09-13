import { DiscordHandler } from '../../discord/discordHandler';
import { NanceConfig } from '../../types';
import { sleep } from '../../utils';

export const discordLogin = async (config: NanceConfig) => {
  const discord = new DiscordHandler(config);
  // eslint-disable-next-line no-await-in-loop
  while (!discord.ready()) { await sleep(50); }
  return discord;
};
