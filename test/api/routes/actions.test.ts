import request from "supertest";
import { Action, ActionPacket } from "@nance/nance-sdk";
import { BASE_URL } from "../constants";

describe("Actions tests", () => {
  let action: Action;

  it("init actionTracking for first action", async () => {
    const allProposalsResponse = await request(BASE_URL).get("/waterbox/proposals")
    expect(allProposalsResponse.body.data.proposals.length).toBeGreaterThan(0);
    const { proposals } = allProposalsResponse.body.data;
    const [proposal] = proposals;
    const aid = proposal.actions[0].uuid;
    const actionInitResponse = await request(BASE_URL).post(`/waterbox/actions/${aid}/init`)
    expect(actionInitResponse.body.success).toBe(true);
  });

  it("GET all actions", async () => {
    const response = await request(BASE_URL).get("/waterbox/actions")
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    const actionPackets = response.body.data as ActionPacket[];
    ([{ action }] = actionPackets)
    expect(action.uuid).toBeTruthy();
  });

  it("GET single action", async () => {
    const response = await request(BASE_URL).get(`/waterbox/actions/${action.uuid}`);
    expect(response.body.success).toBe(true);
  });
});
