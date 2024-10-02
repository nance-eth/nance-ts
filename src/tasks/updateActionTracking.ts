import { ActionTracking, Cancel } from "@nance/nance-sdk";
import { getDb } from "@/dolt/pools";
import { initActionTrackingStruct } from "./helpers/actionTracking";
import { viableActions } from "@/api/routes/space/actions";

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
    const { proposals } = await dolt.getProposals({
      actionTrackingStatus: viableActions
    });

    // get target cancel actions so we can update status of target
    const cancelTargets = proposals.flatMap((p) => {
      return p.actions?.filter((a) => a.type === "Cancel")
        .map((a) => (a.payload as Cancel).targetActionUuid) || [];
    });

    proposals.forEach(async (proposal) => {
      if (!proposal.actions) return;
      const updatedActionTracking = proposal.actions.map((action) => {
        if (!action.actionTracking) throw Error("actionTracking is not defined for action");
        return action.actionTracking.map((tracking) => {
          let { status } = tracking;
          const { governanceCycle: gc } = tracking;
          if (gc < governanceCycle) status = "Executed";
          if (gc === governanceCycle) status = "Queued";
          if (cancelTargets.includes(action.uuid) && gc >= governanceCycle) status = "Cancelled";
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
