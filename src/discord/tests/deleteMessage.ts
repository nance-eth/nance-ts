import { DiscordHandler } from '../discordHandler';
import { doltConfig } from '../../configLoader';
import { sleep } from '../../utils';

async function main(messageId: string) {
  const { config } = await doltConfig('thirstythirsty');
  console.log(config);
  const discord = new DiscordHandler(config);
  await sleep(5000);
  await discord.deleteMessage(messageId);
}

main(process.argv[1]);
