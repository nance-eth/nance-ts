import { Proposal } from "@nance/nance-sdk";

export function logProposal(
  proposal: Proposal,
  space: string,
  uploaderAddress: string,
  operation: string
) {
  console.log('======================================================');
  console.log(`=============== ${operation} Proposal ================`);
  console.log('======================================================');
  console.log(`space ${space}, author ${uploaderAddress}`);
  console.log(JSON.stringify(proposal, null, 2));
  console.log('======================================================');
  console.log('======================================================');
  console.log('======================================================');
}
