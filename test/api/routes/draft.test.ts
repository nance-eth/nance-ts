import request from "supertest";
import { BASE_URL, headers } from "../constants";
import { waitForDiscordURL } from "../helpers/discord";

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
    expect(firstDiscordURLResponse.body.error).toBeUndefined();
  });

  it("edit draft", async () => {
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
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set({ ...headers, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal: { ...proposal, title: `${uuid.substring(0, 5)} edit`, status: "Discussion" } });
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
    // wait for new URL to update
    const { url } = await waitForDiscordURL(uuid, firstDiscordURL);
    expect(url).not.toBe(firstDiscordURL);
  });
});
