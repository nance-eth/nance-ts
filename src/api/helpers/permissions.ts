import { ProposalStatus } from "@nance/nance-sdk";
import { nanceAddress } from "@/keys";

export const isNanceAddress = (address: string) => {
  return address.toLowerCase() === nanceAddress.toLowerCase();
};

export const isNanceSpaceOwner = (spaceOwners: string[], address: string) => {
  return spaceOwners.includes(address);
};

export function canEditProposal(status: ProposalStatus) {
  return (
    status === "Discussion" ||
    status === "Draft" ||
    status === "Temperature Check" ||
    status === "Archived"
  );
}
