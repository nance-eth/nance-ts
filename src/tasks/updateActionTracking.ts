import { ActionTracking } from "@nance/nance-sdk";
import { getDb } from "@/dolt/pools";
import { initActionTrackingStruct } from "./helpers/actionTracking";

export const updateActionTracking = async (space: string, governanceCycle: number) => {
  try {
    const dolt = getDb(space);

    // initActionTracking for each proposal that was approved this cycle
    const { proposals: newProposals } = await dolt.getProposals({ status: ["Approved"], governanceCycle });
    newProposals.forEach(async (proposal) => {
      if (!proposal.actions) return;
      const actionTracking = initActionTrackingStruct(proposal, governanceCycle);
      await dolt.updateActionTracking(proposal.uuid, actionTracking);
    });

    // update action tracking for each proposal that was approved in previous cycles
    const { proposals: oldProposals } = await dolt.getProposals({
      actionTrackingStatus: ["Active", "Future", "Polling", "Poll Required", "Queued"]
    });
    oldProposals.forEach(async (proposal) => {
      if (!proposal.actions) return;
      const updatedActionTracking = proposal.actions.map((action) => {
        if (!action.actionTracking) throw Error("actionTracking is not defined for action");
        return action.actionTracking.map((tracking) => {
          let { status } = tracking;
          if (tracking.governanceCycle < governanceCycle) status = "Executed";
          if (tracking.governanceCycle === governanceCycle) status = "Queued";
          return { ...tracking, status } as ActionTracking;
        });
      });
      await dolt.updateActionTracking(proposal.uuid, updatedActionTracking);
    });
  } catch (e) {
    console.error(`error updating action tracking for ${space}`);
    throw e;
  }
};
