import request from "supertest";
import { Proposal } from "@nance/nance-sdk";
import { AUTHOR, BASE_URL, COAUTHOR } from "../constants";
import { waitForDiscordURL } from "../helpers/discord";
import { sleep } from "@/utils";

const proposal = { title: "Proposal submission try", body: "hi", status: "Temperature Check" };

describe("Proposal submission validation", () => {
  let uuid: string;

  it("POST Draft ideas proposal", async () => {
    const overrideSpaceInfo = {
      config: {
        discord: {
          channelIds: {
            proposals: "1166153072536457216",
          }
        },
        proposalSubmissionValidation: {
          metStatus: "Temperature Check",
          minBalance: 5,
          notMetStatus: "Discussion",
          type: "snapshot"
        },
        snapshot: {
          space: "jigglyjams.eth"
        }
      }
    };

    const response = await request(BASE_URL)
      .post("/waterbox/proposals")
      .set({ authorization: COAUTHOR, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal });
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
    uuid = response.body.data.uuid;
    expect(response.body.data.uuid).toBeDefined();
    expect(typeof response.body.data.uuid).toBe("string");
    const { response: firstDiscordURLResponse } = await waitForDiscordURL(uuid);
    expect(firstDiscordURLResponse.body.error).toBeUndefined();
  });

  it("check author and coauthor", async () => {
    const response = await request(BASE_URL).get(`/waterbox/proposal/${uuid}`);
    const data = response.body.data as Proposal;
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(data.authorAddress).toBeFalsy();
    expect(data?.coauthors?.length).toBeGreaterThan(0);
    expect(data?.coauthors?.[0]).toBe(COAUTHOR);
  });

  it("override and give other address authorship", async () => {
    const overrideSpaceInfo = {
      config: {
        discord: {
          channelIds: {
            proposals: "1166153072536457216",
            ideas: "1166153072536457216"
          }
        },
        proposalSubmissionValidation: {
          metStatus: "Temperature Check",
          minBalance: 0,
          notMetStatus: "Discussion",
          type: "snapshot"
        },
        snapshot: {
          space: "jigglyjams.eth"
        }
      }
    };
    // clear cache so we can send another override
    const cacheClear = await request(BASE_URL).get("/waterbox/cache/clear");
    expect(cacheClear.body.success).toBe(true);
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set({ authorization: AUTHOR, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal: { ...proposal, title: `${uuid.substring(0, 5)} edit`, status: "Discussion" } });
    await sleep(2000); // wait for discord to update
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
  }, 15_000);

  it("confirm status Temperature Check", async () => {
    const response = await request(BASE_URL).get(`/waterbox/proposal/${uuid}`);
    const data = response.body.data as Proposal;
    expect(data.status).toBe("Temperature Check");
  });
});
