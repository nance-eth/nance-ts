import { getSpaceConfig } from "../../api/helpers/getSpace";
import { DoltHandler } from "../../dolt/doltHandler";
import { pools } from "../../dolt/pools";
import { sleep } from "../../utils";
import { DiscordHandler } from "../discordHandler";

async function main() {
  const space = "juicebox";
  const spaceConfig = await getSpaceConfig(space);
  const dialogHandler = new DiscordHandler(spaceConfig.config);
  await sleep(2000);
  const dolt = new DoltHandler(pools[space], spaceConfig.config.proposalIdPrefix);
  const proposal = await dolt.getProposalByAnyId("509");
  await dialogHandler.editDiscussionMessage(proposal);
}

main();
