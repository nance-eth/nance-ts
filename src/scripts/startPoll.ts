import { pools } from "../dolt/pools";
import { DoltHandler } from "../dolt/doltHandler";
import { getLastSlash, sleep } from "../utils";
import { getSpaceConfig } from "../api/helpers/getSpace";
import { discordLogin } from "../api/helpers/discord";

async function main() {
  await sleep(2000);
  const spaceConfig = await getSpaceConfig('moondao');
  const dolt = new DoltHandler(pools[spaceConfig.config.name], spaceConfig.config.proposalIdPrefix);
  const proposal = await dolt.getProposalByAnyId('152');
  const discord = await discordLogin(spaceConfig.config);
  // const discussionThreadURL = await discord.startDiscussion(proposal);
  // dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
  // await discord.setupPoll(getLastSlash(discussionThreadURL))
  await discord.editDiscussionMessage(proposal, true);
}

main();
