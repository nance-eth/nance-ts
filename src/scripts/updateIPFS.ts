import { getSpaceConfig } from "@/api/helpers/getSpace";
import { getDb, initializePools } from "@/dolt/pools";
import { SnapshotHandler } from "@/snapshot/snapshotHandler";
import { sleep } from "@/utils";

const SPACE = "moondao"

async function main() {
  await initializePools();
  const dolt = getDb(SPACE);
  const { config } = await getSpaceConfig(SPACE);
  const snapshot = new SnapshotHandler('', config);
  const proposals = await snapshot.getAllProposalsByScore();
  for (const p of proposals) {
    if (!p.voteURL || !p.ipfsURL) {
      console.log(p.proposalId, p.title, "something wrong here")
      continue
    }
    console.log("updating", p.voteURL, p.ipfsURL);
    await dolt.updateIPFS(p.voteURL, p.ipfsURL);
  }
}

main();
