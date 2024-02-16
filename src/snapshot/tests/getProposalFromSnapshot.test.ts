import { getProposalFromSnapshot } from "../snapshotProposals";

async function main() {
  const proposal = await getProposalFromSnapshot('0x339fb6a7dd08cbb0e92630aea3b8fde566a57c5f0839cce5b3affbb94be4bdb1');
  console.log(proposal);
}

main();
