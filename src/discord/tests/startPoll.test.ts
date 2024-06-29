import { discordLogin } from "../../api/helpers/discord";
import { getSpaceConfig } from "../../api/helpers/getSpace";
import { sleep } from "../../utils";

const messageId = "1256303684166619249";

async function main() {
  await sleep(2000);
  const { config } = await getSpaceConfig("juicebox");
  const discord = await discordLogin(config);
  discord.setupPoll(messageId);
}

main();
