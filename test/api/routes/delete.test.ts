/* eslint-disable no-await-in-loop */
import request from "supertest";
import { ADMIN, BASE_URL, headers } from "../constants";
import { sleep } from "@/utils";

describe("Admin update status back to a status that can be deleted", () => {
  it("patch them", async () => {
    const allProposalsResponse = await request(BASE_URL).get("/waterbox/proposals?cycle=0,1");
    expect(allProposalsResponse.body.data.proposals.length).toBeGreaterThan(0);
    const { proposals } = allProposalsResponse.body.data;
    for (let i = 0; i < proposals.length; i += 1) {
      const response = await request(BASE_URL)
        .patch(`/waterbox/proposal/${proposals[i].uuid}/status/Archived`)
        .set({ authorization: ADMIN });
      expect(response.body.error).toBeUndefined();
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      await sleep(200);
    }
  });
});

describe("DELETE all proposals after", () => {
  it("delete them", async () => {
    const allProposalsResponse = await request(BASE_URL).get("/waterbox/proposals?cycle=0,1");
    expect(allProposalsResponse.body.data.proposals.length).toBeGreaterThan(0);
    const { proposals } = allProposalsResponse.body.data;
    for (let i = 0; i < proposals.length; i += 1) {
      const response = await request(BASE_URL)
        .delete(`/waterbox/proposal/${proposals[i].uuid}`)
        .set(headers);
      expect(response.body.error).toBeUndefined();
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      await sleep(200);
    }
  });
});
