import { ADMIN } from "../api/constants";
import { getAddressVotingPower } from "@/snapshot/snapshotVotingPower";

// describe("Test Snapshot API calls", () => {
//   it("Get address voting power", async () => {
//     const votingPower = await getAddressVotingPower(ADMIN, "jbdao.eth");
//     expect(votingPower).toBeGreaterThan(0);
//   }, 10_000);
// });

async function main() {
  const votingPower = await getAddressVotingPower(ADMIN, "jbdao.eth");
  console.log(votingPower);
}

main();
