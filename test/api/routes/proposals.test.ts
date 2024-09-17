/* eslint-disable no-await-in-loop */
import request from "supertest";
import { Action, ProposalPacket, actionsToYaml, trimActionsFromBody } from "@nance/nance-sdk";
import { AUTHOR, BASE_URL, COAUTHOR, headers } from "../constants";
import { sleep, uuidGen } from "@/utils";

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

// export to be used in other test files
export const uuid = uuidGen();

const actions: Action[] = [
  {
    type: "Transfer",
    uuid: uuidGen(),
    governanceCycles: [1, 2, 3],
    chainId: 1,
    payload: {
      contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      to: AUTHOR,
      amount: "1",
      decimals: 6
    }
  },
  {
    type: "Payout",
    uuid: uuidGen(),
    pollRequired: true,
    chainId: 1,
    payload: {
      project: 1,
      amount: 1000,
      currency: "USD"
    }
  }
];

const proposal = {
  uuid,
  title: "Test Proposal",
  body: `This is a test proposal\n\n${actionsToYaml(actions)}`,
  status: "Discussion",
};

describe("PROPOSAL", () => {
  // POST
  it("POST proposal", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/proposals")
      .set(headers)
      .send({ proposal });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
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
    // add another action to it
    actions.push({
      type: "Payout",
      uuid: uuidGen(),
      chainId: 1,
      pollRequired: true,
      payload: {
        project: 477,
        amount: 1,
        currency: "USD"
      }
    });
    const title = "EDITED";
    const body = `${trimActionsFromBody(proposal.body)}\n\n${actionsToYaml(actions)}`;
    const updatedProposal = { ...proposal, title, body }
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set(headers)
      .send({ proposal: updatedProposal });
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
});
