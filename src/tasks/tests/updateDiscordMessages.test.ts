import { discordLogin } from "../../api/helpers/discord";
import { getSpaceConfig } from '../../api/helpers/getSpace';
import { DoltHandler } from "../../dolt/doltHandler";
import { pools } from "../../dolt/pools";
import { sleep } from '../../utils';

const space = 'juicebox';

async function main() {
  const { config } = await getSpaceConfig(space);
  await sleep(2000);
  const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
  const { proposals } = await dolt.getProposals({ governanceCycle: "74" });
  console.log(proposals);
  Promise.all(proposals.slice().map(async (proposal) => {
    const discord = await discordLogin(config);
    discord.editDiscussionMessage(proposal);
  }));
}

main();
