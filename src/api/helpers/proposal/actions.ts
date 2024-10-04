import { ActionPacket, Proposal } from "@nance/nance-sdk";

export function getActionPacket(proposal: Proposal, aid: string) {
  if (!proposal || !proposal.proposalId) throw Error(`No proposal found containing action id ${aid}`);
  const action = proposal?.actions?.find((a) => a?.uuid === aid);
  if (!action) throw Error("Action not found");
  const actionPacket: ActionPacket = {
    action,
    proposal: {
      title: proposal.title,
      id: proposal.proposalId
    }
  };
  return actionPacket;
}
