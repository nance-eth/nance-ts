import {
  getActionsFromBody,
  ActionStatus,
  ActionTracking,
  Proposal
} from "@nance/nance-sdk";

export function initActionTrackingStruct(proposal: Proposal, currentGovernanceCycle: number) {
  let actions = getActionsFromBody(proposal.body);
  // old style actions stored in individual tables
  // once all proposals are updated to new style, this can be removed
  if (!actions) actions = proposal.actions || [];
  if (actions.length === 0) return null;
  const actionTracking: ActionTracking[][] = actions.map((action) => {
    if (action.pollRequired) {
      const a: ActionTracking = {
        governanceCycle: 0, // initialize to 0, update with correct value when poll is approved
        status: "Poll Required",
      };
      return [a];
    }
    // non-poll actions, track individual governance cycles for repeat actions
    return action.governanceCycles?.map((governanceCycle) => {
      const status: ActionStatus = (currentGovernanceCycle === governanceCycle) ? "Active" : "Future";
      const a: ActionTracking = {
        governanceCycle,
        status,
      };
      return a;
    }) || [];
  });
  if (actionTracking.length === 0) return null;
  return actionTracking;
}
