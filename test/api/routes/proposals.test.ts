/* eslint-disable no-await-in-loop */
import request from "supertest";
import { ProposalPacket } from "@nance/nance-sdk";
import { AUTHOR, BASE_URL, COAUTHOR } from "../constants";
import { sleep } from "@/utils";

const waitForDiscordURL = async (uuid: string, maxAttempts = 20, interval = 1000) => {
  for (let i = 0; i < maxAttempts; i += 1) {
    const response = await request(BASE_URL).get(`/waterbox/proposal/${uuid}`);
    const proposalReponse = response.body;
    const proposalPacket = proposalReponse as ProposalPacket;
    if (proposalPacket.discussionThreadURL !== "" && !proposalPacket.discussionThreadURL) {
      return response;
    }
    await sleep(interval);
  }
  throw new Error("Discord URL not set within the expected time");
};

describe("POST proposal, then GET, then PUT", () => {
  let uuid: string;
  const proposal = {
    title: "Test Proposal",
    body: "This is a test proposal",
    status: "Discussion",
  };

  const headers = {
    authorization: AUTHOR
  };

  // POST
  it("POST proposal", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/proposals")
      .set(headers)
      .send({ proposal });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    uuid = response.body.data.uuid;
    expect(response.body.data.uuid).toBeDefined();
    expect(typeof response.body.data.uuid).toBe("string");
  });

  // GET
  it("fetch proposalId", async () => {
    const response = await waitForDiscordURL(uuid);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.discussionThreadURL).toBeDefined();
    expect(response.body.data.uuid).toBe(uuid);
  });

  // EDIT
  it("edit proposalId 1", async () => {
    await sleep(3000); // discord wait
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set(headers)
      .send({ proposal: { title: "EDITED" } });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  }, 10000);

  // set to archive as non author
  it("non-author archive", async () => {
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set({ authorization: COAUTHOR })
      .send({ proposal: { status: "Archived" } });
    expect(response.body.success).toBe(false);
  });

  it("set to invalid proposal status", async () => {
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set(headers)
      .send({ proposal: { status: "Archivwwww" } });
    expect(response.body.success).toBe(false);
  });

  // DELETE
  it("delete proposal", async () => {
    await sleep(2000); // discord wait
    const response = await request(BASE_URL)
      .delete(`/waterbox/proposal/${uuid}`)
      .set(headers);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
