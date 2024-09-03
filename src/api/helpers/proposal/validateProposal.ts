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
  const { proposal, proposalInDb, uploaderAddress, config } = input;
  const { status: _status, coauthors: _coauthors } = proposal;
  const { authorAddress: _authorAddress } = proposalInDb || { authorAddress: undefined };
  const { proposalSubmissionValidation } = config;

  if (!proposalSubmissionValidation || !uploaderAddress) {
    return { authorAddress: uploaderAddress, coauthors: _coauthors, status: _status };
  }

  const { minBalance } = proposalSubmissionValidation;
  const balance = await getAddressVotingPower(uploaderAddress, config.snapshot.space);

  if (balance < minBalance) {
    const coauthors = uniq([..._coauthors || [], uploaderAddress]);
    return { coauthors, status: proposalSubmissionValidation.notMetStatus };
  }
  const status = (_status === "Discussion") ? proposalSubmissionValidation.metStatus : _status;
  const authorAddress = _authorAddress || uploaderAddress;
  let coauthors = _coauthors;
  if (uploaderAddress !== authorAddress) {
    coauthors = uniq([..._coauthors || [], uploaderAddress]);
  }
  return { authorAddress, coauthors, status };
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
  const noAuthorAndAddressIsFirstCoauthor = !authorAddress && addressIsFirstCoauthor;
  if (operation === "archive") {
    if (
      proposal.status === "Archived" &&
      (!addressIsAuthor && !permissionElevated && !noAuthorAndAddressIsFirstCoauthor)) {
      throw new Error("only author or spaceOwner can archive proposal");
    }
  } else if (operation === "delete") {
    if (!addressIsAuthor && !permissionElevated && !noAuthorAndAddressIsFirstCoauthor) {
      throw new Error("only author or spaceOwner can delete proposal");
    }
  }
}
