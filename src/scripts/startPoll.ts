import { getLastSlash } from "../utils";
import { getSpaceConfig } from "../api/helpers/getSpace";
import { discordLogin } from "../api/helpers/discord";
import { getDb, initializePools } from "@/dolt/pools";

const SPACE = "moondao"

async function main() {
  await initializePools();
  const dolt = getDb(SPACE)
  const proposal = await dolt.getProposalByAnyId('166');
  const { config } = await getSpaceConfig(SPACE);
  console.log(proposal)
  const discord = await discordLogin(config);
  if (!proposal.discussionThreadURL) throw Error();
  // const discussionThreadURL = await discord.startDiscussion(proposal);
  // dolt.updateDiscussionURL({ ...proposal, discussionThreadURL });
  await discord.setupPoll(getLastSlash(proposal?.discussionThreadURL))
  await discord.editDiscussionMessage(proposal);
}

main();
