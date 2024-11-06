import { uniq } from "lodash";
import { NanceConfig, NewProposal, Proposal, UpdateProposal } from "@nance/nance-sdk";
import { getAddressVotingPower } from "@/snapshot/snapshotVotingPower";
import { isNanceSpaceOwner } from "../permissions";
import { numToPrettyString } from "@/utils";

type ValidateProposalByVp = {
  proposal: NewProposal | UpdateProposal,
  proposalInDb?: Proposal,
  uploaderAddress: string,
  config: NanceConfig
};

export async function validateUploaderVp(input: ValidateProposalByVp) {
  const { proposal, proposalInDb, uploaderAddress, config } = input;
  const { status: _status } = proposal;
  const { authorAddress: _authorAddress, coauthors: _coauthors } = proposalInDb || { authorAddress: undefined };
  const { proposalSubmissionValidation } = config;

  if (!proposalSubmissionValidation) {
    return { authorAddress: uploaderAddress, coauthors: _coauthors, status: _status, votingPower: 0 };
  }

  // TODO change to minVotingPower in SDK
  const { minBalance: minVotingPower } = proposalSubmissionValidation;
  const votingPower = await getAddressVotingPower(uploaderAddress, config.snapshot.space);

  let coauthors = _coauthors;
  let authorAddress = _authorAddress;
  let status = _status;
  if (votingPower < minVotingPower) {
    // always allow submission if Draft
    if (_status !== "Draft" && !_authorAddress) {
      throw new Error(`
        Address ${uploaderAddress} does not meet minimum voting power of
        ${numToPrettyString(proposalSubmissionValidation.minBalance)} to
        submit a proposal!
      `);
    }
    coauthors = uniq([..._coauthors || [], uploaderAddress]);
    return { authorAddress, coauthors, status, votingPower };
  }

  // MoonDAO wants proposals to go to Temperature Check if they meet minVotingPower
  if (status === "Discussion") {
    status = proposalSubmissionValidation.metStatus;
  }

  if (!authorAddress) {
    authorAddress = uploaderAddress;
  } else {
    coauthors = uniq([..._coauthors || [], uploaderAddress]);
  }
  return { authorAddress, coauthors, status, votingPower };
}

export function checkPermissions(
  proposal: UpdateProposal,
  proposalInDb: Proposal,
  address: string,
  spaceOwners: string[],
  operation: "archive" | "delete" | "admin"
) {
  const { authorAddress, coauthors } = proposalInDb;
  const addressIsAuthor = authorAddress === address;
  const permissionElevated = isNanceSpaceOwner(spaceOwners, address);
  const addressIsFirstCoauthor = address === coauthors?.[0];
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
  } else if (operation === "admin") {
    if (!permissionElevated) {
      throw new Error("only spaceOwner can do this");
    }
  }
}
