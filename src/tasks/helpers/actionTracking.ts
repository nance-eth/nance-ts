import {
  getActionsFromBody,
  ActionStatus,
  ActionTracking,
  PayoutV1,
  Proposal
} from "@nance/nance-sdk";

export function initActionTrackingStruct(proposal: Proposal, currentGovernanceCycle: number) {
  let actions = getActionsFromBody(proposal.body);
  // old style actions stored in individual tables
  // once all proposals are updated to new style, this can be removed
  if (!actions) actions = proposal.actions || [];
  if (actions.length === 0) return null;
  const actionTracking: ActionTracking[][] = actions.map((action) => {
    const oldActionTracking: ActionTracking[] = [];
    if (action.type) {
      const payout = action.payload as PayoutV1;
      for (let i = 0; i < payout.count || i < 1; i += 1) {
        const governanceCycle = Number(proposal.governanceCycle) + i;
        let status: ActionStatus = "Future";
        if (governanceCycle < currentGovernanceCycle) status = "Executed";
        if (governanceCycle === currentGovernanceCycle) status = "Active";
        const a: ActionTracking = {
          governanceCycle,
          status,
        };
        oldActionTracking.push(a);
      }
    }
    if (oldActionTracking.length > 0) return oldActionTracking;
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
