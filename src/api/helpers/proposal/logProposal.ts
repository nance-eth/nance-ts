import { NewProposal, UpdateProposal } from "@nance/nance-sdk";

export function logProposal(
  proposal: NewProposal | UpdateProposal,
  space: string,
  uploaderAddress: string,
  votingPower: number,
  operation: string,
) {
  console.log('======================================================');
  console.log(`=============== ${operation} Proposal ================`);
  console.log('======================================================');
  console.log(`space ${space}, author ${uploaderAddress}, votingPower ${votingPower}`);
  console.log(JSON.stringify(proposal, null, 2));
  console.log('======================================================');
  console.log('======================================================');
  console.log('======================================================');
}
