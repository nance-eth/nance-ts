import { getSpaceConfig } from "../../api/helpers/getSpace";
import { DoltHandler } from "../../dolt/doltHandler";
import { pools } from "../../dolt/pools";
import { sleep } from "../../utils";
import { DiscordHandler } from "../discordHandler";

async function main() {
  const space = "daosquare";
  const spaceConfig = await getSpaceConfig(space);
  await sleep(1000);
  const dialogHandler = new DiscordHandler(spaceConfig.config);
  const dolt = new DoltHandler(pools[space], spaceConfig.config.proposalIdPrefix);
  const proposal = await dolt.getProposalByAnyId("15");
  await dialogHandler.editDiscussionMessage(proposal);
}

main();
