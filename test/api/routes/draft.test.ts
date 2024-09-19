import request from "supertest";
import { sleep } from "@/utils";
import { BASE_URL, headers } from "../constants";
import { waitForDiscordURL } from "./proposals.test";

const overrideSpaceInfo = {
  config: {
    discord: {
      channelIds: {
        ideas: "1166153072536457216"
      }
    }
  }
};

describe("Draft Proposal", () => {
  // POST Draft
  it("POST Draft ideas proposal", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/proposals")
      .set({ ...headers, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal: { title: "draft idea", body: "hi", status: "Draft" } });
    // await waitForDiscordURL(response.body.data.uuid)
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.uuid).toBeDefined();
    expect(typeof response.body.data.uuid).toBe("string");
  });
})
