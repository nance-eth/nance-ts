import { getSpaceConfig, getSpaceInfo } from '../api/helpers/getSpace';
import { DiscordHandler } from '../discord/discordHandler';
import { sleep } from '../utils';

const spaceId = process.argv[2];
const messageId = process.argv[3];

async function main() {
  const { config } = await getSpaceConfig(spaceId);
  const discord = new DiscordHandler(config);
  await sleep(2000);
  console.log(await discord.deleteMessage(messageId));  
}

main();
