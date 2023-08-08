import { doltConfig } from '../../configLoader';
import { sleep } from '../../utils';
import { DiscordHandler } from '../discordHandler';

async function main() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  const discord = new DiscordHandler(config);
  await sleep(1000);
  const reactions = await discord.getPollVoters('1128890689690804346');
  console.log(reactions);
  await discord.sendPollResults(reactions, true, '1128890689690804346');
}

main();
