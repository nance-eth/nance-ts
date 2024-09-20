import request from "supertest";
import type { Response } from "supertest";
import { BASE_URL, headers } from "../constants";
import { waitForDiscordURL } from "../helpers/discord";
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
  let firstDiscordURL: string;

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
    const { response: firstDiscordURLResponse, url } = await waitForDiscordURL(uuid);
    firstDiscordURL = url;
    expect(firstDiscordURLResponse.body.data.disc).toBeGreaterThan(1);
  });

  it("edit draft", async () => {
    await waitForDiscordURL(uuid);
    await sleep(2000);
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set({ ...headers, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal: { ...proposal, title: `${uuid.substring(0, 5)} edit`, proposalId: null } });
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.uuid).toBeDefined();
    expect(typeof response.body.data.uuid).toBe("string");
  });

  it("move draft to discussion", async () => {
    await sleep(2000);
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set({ ...headers, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal: { ...proposal, title: `${uuid.substring(0, 5)} edit`, status: "Discussion" } });
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
    // wait for new URL to update
    await sleep(2000);
    const { url } = await waitForDiscordURL(uuid);
    // make sure discussionURL got updated
    expect(firstDiscordURL).not.toBe(url);
    console.log(`http://localhost:3003/waterbox/proposal/${uuid}`);
  }, 15_000);
});
