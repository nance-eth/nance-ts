import { uniq } from "lodash";
import { NanceConfig, Proposal } from "@nance/nance-sdk";
import { getAddressVotingPower } from "@/snapshot/snapshotVotingPower";
import { isNanceSpaceOwner } from "../permissions";

type ValidateProposalByVp = {
  proposal: Proposal,
  proposalInDb?: Proposal,
  uploaderAddress?: string,
  config: NanceConfig
};

export async function validateUploaderVp(input: ValidateProposalByVp) {
  const { proposal, proposalInDb, uploaderAddress: address, config } = input;
  const { status: _status, coauthors: _coauthors } = proposal;
  const { authorAddress: _authorAddress } = proposalInDb || { authorAddress: undefined };
  const { proposalSubmissionValidation } = config;
  if (
    (_status === "Discussion" || _status === "Temperature Check") &&
    proposalSubmissionValidation && address
  ) {
    const { minBalance } = proposalSubmissionValidation;
    const balance = await getAddressVotingPower(address, config.snapshot.space);
    if (balance < minBalance) {
      // make uploader a coauthor
      const coauthors = !_coauthors ? [address] : uniq([..._coauthors, address]);
      const status = proposalSubmissionValidation.notMetStatus;
      return { coauthors, status };
    }
    const status = (_status === "Discussion") ? proposalSubmissionValidation.metStatus : _status;
    const authorAddress = !_authorAddress ? address : _authorAddress;
    let coauthors = _coauthors;
    if (address !== authorAddress) {
      coauthors = !_coauthors ? [address] : uniq([..._coauthors, address]);
    }
    return { authorAddress, coauthors, status };
  }
  return { authorAddress: _authorAddress, coauthors: _coauthors, status: _status };
}

export function checkPermissions(
  proposal: Proposal,
  proposalInDb: Proposal,
  address: string,
  spaceOwners: string[],
  operation: "archive" | "delete"
) {
  const { authorAddress } = proposalInDb;
  const addressIsAuthor = authorAddress === address;
  const permissionElevated = isNanceSpaceOwner(spaceOwners, address);
  const addressIsFirstCoauthor = address === proposal?.coauthors?.[0];
  if (operation === "archive") {
    if (
      proposal.status === "Archived" &&
      (!addressIsAuthor || !permissionElevated || !addressIsFirstCoauthor)) {
      throw new Error("only author or spaceOwner can archive proposal");
    }
  } else if (operation === "delete") {
    if (!authorAddress && !addressIsFirstCoauthor && !permissionElevated) {
      throw new Error("only author or spaceOwner can delete proposal");
    }
  }
}
