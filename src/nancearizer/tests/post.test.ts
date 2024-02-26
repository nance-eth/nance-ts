import { postSummary } from "..";
import { getSpaceConfig } from "../../api/helpers/getSpace";
import { DoltHandler } from "../../dolt/doltHandler";
import { pools } from "../../dolt/pools";
import { sleep } from "../../utils";

const space = "juicebox";

async function main() {
  const { config } = await getSpaceConfig(space);
  await sleep(1000);
  const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
  const proposal = await dolt.getProposalByAnyId("478");
  const summary = await postSummary(proposal, "proposal");
  console.log(summary);
}

main();
