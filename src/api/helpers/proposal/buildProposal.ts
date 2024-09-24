import { Proposal, ProposalStatus, ProposalStatusNames } from "@nance/nance-sdk";
import { Middleware } from "@/api/routes/space/middleware";
import { uuidGen } from "@/utils";

type PickFromMiddleware = "config" | "currentCycle" | "currentEvent" | "nextProposalId";
type BuildProposalInput = Pick<Middleware, PickFromMiddleware> & {
  proposal: Proposal;
  proposalInDb?: Proposal;
  status: ProposalStatus;
  authorAddress?: string;
  coauthors?: string[];
  snapshotId?: string;
};

export function buildProposal(input: BuildProposalInput): Proposal {
  // merge old and new values
  const { proposal, proposalInDb, config, currentEvent, currentCycle, nextProposalId } = input;
  const { status, authorAddress, coauthors, snapshotId } = input;

  // validate status input
  if (status && !ProposalStatusNames.includes(status)) {
    throw Error(`Invalid proposal status. Must be ${ProposalStatusNames.join(" | ")}`);
  }

  // assign uuid
  const uuid = proposalInDb?.uuid || proposal.uuid || uuidGen();

  // assign voteSetup
  const voteSetup = proposal.voteSetup || {
    type: "basic",
    choices: ["For", "Against", "Abstain"]
  };

  // assign proposalId
  let proposalId = proposalInDb?.proposalId;
  if (!proposalId &&
    (proposal.status === "Discussion" || proposal.status === "Temperature Check")
  ) {
    proposalId = nextProposalId;
  }

  // assign governanceCycle
  let governanceCycle = proposalInDb?.governanceCycle;
  if (!governanceCycle) {
    if (config.allowCurrentCycleSubmission &&
      currentEvent.title !== "Snapshot Vote"
    ) {
      governanceCycle = currentCycle;
    } else {
      governanceCycle = currentCycle + 1;
    }
  }

  if (status === "Draft") governanceCycle = undefined;

  const title = proposal.title || proposalInDb?.title || "Untitled Proposal";

  return {
    ...proposalInDb,
    ...proposal,
    title,
    uuid,
    status,
    authorAddress,
    coauthors,
    proposalId,
    voteURL: snapshotId,
    voteSetup,
    governanceCycle,
  };
}
