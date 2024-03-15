import { getSpaceConfig } from "../../api/helpers/getSpace";
import { sleep } from "../../utils";
import { DiscordHandler } from "../discordHandler";

async function main() {
  const space = "juicebox";
  const spaceConfig = await getSpaceConfig(space);
  const testSpaceConfig = await getSpaceConfig("waterbox");
  await sleep(1000);
  const discord = new DiscordHandler(spaceConfig.config);
  const testDiscord = new DiscordHandler(testSpaceConfig.config);
  await sleep(1000);
  const pollResults = await discord.getPollVoters("1212956872752111647");
  console.log(pollResults);
  await testDiscord.sendPollResults(pollResults, true, "1218238014396829816");
}

main();
