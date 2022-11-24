import { DiscordHandler } from '../discordHandler';
import { getConfig } from '../../configLoader';
import { sleep } from '../../utils';

async function main() {
  const config = await getConfig();
  const discord = new DiscordHandler(config);
  await sleep(1000);
  discord.setStatus();
}

main();
