import request from "supertest";
import { BASE_URL, headers } from "../constants";
import { sleep } from "@/utils";

const overrideSpaceInfo = {
  config: {
    discord: {
      channelIds: {
        ideas: "1166153072536457216" // Nance forum
      }
    }
  }
};

const proposal = { title: "draft idea", body: "hi", status: "Draft" };

describe("Draft Proposal", () => {
  let uuid: string;
  // POST Draft
  it("POST Draft ideas proposal", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/proposals")
      .set({ ...headers, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal });
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
    uuid = response.body.data.uuid;
    expect(response.body.data.uuid).toBeDefined();
    expect(typeof response.body.data.uuid).toBe("string");
  });

  it("move draft to discussion", async () => {
    console.log("uuid", uuid)
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set({ ...headers, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal: { ...proposal, status: "Discussion" } });
    console.log(response.body.data)
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
  });
});
