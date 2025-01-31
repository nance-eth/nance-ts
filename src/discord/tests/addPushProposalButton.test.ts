import { ThreadChannel, ForumChannel } from "discord.js";
import { discordLogin } from "@/api/helpers/discord";
import { pushProposalActionRow } from "../button/pushProposal";
import { getSpaceConfig } from "@/api/helpers/getSpace";
import { initializePools } from "@/dolt/pools";

const space = "moondao";
const threadId = "1313956731210170459";

async function main() {
  await initializePools();
  const { config } = await getSpaceConfig(space);
  const discord = await discordLogin(config);
  const channel = discord.getAlertChannel() as unknown as ForumChannel;
  const post = await channel.threads.fetch(threadId) as ThreadChannel;
  const messageObj = await post.fetchStarterMessage();

  await messageObj?.edit({
    embeds: [messageObj.embeds[0]],
    components: [pushProposalActionRow]
  });
}

main();
