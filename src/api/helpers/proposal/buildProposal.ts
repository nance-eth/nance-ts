import { Proposal, ProposalStatus } from "@nance/nance-sdk";
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

  // assign uuid
  const uuid = proposalInDb?.uuid || proposal.uuid || uuidGen();

  // assign voteSetup
  const voteSetup = proposal.voteSetup || {
    type: "basic",
    choices: ["For", "Against", "Abstain"]
  };

  // assign proposalId
  let proposalId: number | undefined;
  if (!proposal.proposalId &&
    (proposal.status === "Discussion" || proposal.status === "Temperature Check")
  ) {
    proposalId = nextProposalId;
  }

  // assign governanceCycle
  let governanceCycle = currentCycle;
  if (!config.allowCurrentCycleSubmission ||
    currentEvent.title !== "Temperature Check"
  ) {
    governanceCycle += 1;
  }

  return {
    ...proposal,
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
