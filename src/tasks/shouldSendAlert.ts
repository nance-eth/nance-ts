import { getDb } from "@/dolt/pools";

export const shouldSendAlert = async (space: string) => {
  const dolt = getDb(space);
  const temperatureCheckOrVotingProposals = await dolt.getProposals({
    status: ["Temperature Check", "Voting"],
  });
  console.log(temperatureCheckOrVotingProposals.proposals.length);
  return temperatureCheckOrVotingProposals.proposals.length > 0;
};
