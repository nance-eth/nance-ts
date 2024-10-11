import request from "supertest";
import { Action, ActionPacket } from "@nance/nance-sdk";
import { ADMIN, BASE_URL } from "../constants";

describe("Actions tests", () => {
  let actionPackets: ActionPacket[];
  let action: Action;

  it("init actionTracking for first action", async () => {
    const allProposalsResponse = await request(BASE_URL).get("/waterbox/proposals?cycle=0,1");
    expect(allProposalsResponse.body.data.proposals.length).toBeGreaterThan(0);
    const { proposals } = allProposalsResponse.body.data;
    const [proposal] = proposals;
    const aid = proposal.actions[0].uuid;
    // const actionInitResponse = await request(BASE_URL).get(`/waterbox/actions/${aid}/init`);
    // expect(actionInitResponse.body.success).toBe(false);

    const setStatusApprovedResponse = await request(BASE_URL)
      .patch(`/waterbox/proposal/${proposal.uuid}/status/Approved`)
      .set({ authorization: ADMIN })
      .send();
    expect(setStatusApprovedResponse.body.success).toBe(true);

    const actionInitResponse2 = await request(BASE_URL).get(`/waterbox/actions/${aid}/init`);
    expect(actionInitResponse2.body.success).toBe(true);
  });

  it("GET all actions", async () => {
    const response = await request(BASE_URL).get("/waterbox/actions");
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    actionPackets = response.body.data as ActionPacket[];
    [{ action }] = actionPackets;
    expect(action.uuid).toBeTruthy();
  });

  it("GET single action", async () => {
    const response = await request(BASE_URL).get(`/waterbox/actions/${action.uuid}`);
    expect(response.body.success).toBe(true);
  });

  it("try to start poll for action that doesn't require one", async () => {
    // get first action that doesn't require poll
    const nonPollAP = actionPackets.find((ap) => !ap.action.pollRequired);
    if (!nonPollAP) throw new Error("No nonPollAction found");
    const response = await request(BASE_URL)
      .post(`/waterbox/actions/${nonPollAP.action.uuid}/poll`);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toEqual("Action does not require a poll");
  });

  it("start poll for action that does require one", async () => {
    // get first action that doesn't require poll
    const pollAP = actionPackets.find((ap) => ap.action.pollRequired);
    if (!pollAP) throw new Error("No pollAction found");
    const response = await request(BASE_URL)
      .post(`/waterbox/actions/${pollAP.action.uuid}/poll`);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });
});
