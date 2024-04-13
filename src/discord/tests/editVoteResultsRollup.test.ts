import { getSpaceConfig } from "../../api/helpers/getSpace";
import { dbOptions } from "../../dolt/dbConfig";
import { DoltHandler } from "../../dolt/doltHandler";
import { DoltSQL } from "../../dolt/doltSQL";
import { DiscordHandler } from "../discordHandler";

async function main() {
  const { config } = await getSpaceConfig("juicebox");
  const discord = new DiscordHandler(config);
  const doltSQL = new DoltSQL(dbOptions(config.dolt.repo));
  const dolt = new DoltHandler(doltSQL, config.proposalIdPrefix);
  const { proposals } = await dolt.getProposals({ governanceCycle: "72" });
  console.dir(proposals, { depth: null });
  await discord.editVoteResultsRollup("1228495121746628658", proposals);
}

main();
