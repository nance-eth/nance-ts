import { doltConfig } from '../configLoader';
import { DiscordHandler } from '../discord/discordHandler';
import { sleep } from '../utils';

const messageId = process.argv[2];

async function main() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  const discord = new DiscordHandler(config);
  await sleep(2000);
  console.log(await discord.deleteMessage(messageId));  
}

main();
