import request from "supertest";
import { Action, actionsToYaml, trimActionsFromBody } from "@nance/nance-sdk";
import { AUTHOR, BASE_URL, COAUTHOR, headers } from "../constants";
import { sleep, uuidGen } from "@/utils";
import { waitForDiscordURL } from "../helpers/discord";

const overrideSpaceInfo = {
  config: {
    discord: {
      channelIds: {
        proposals: "1166153072536457216",
      }
    },
  }
};

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
  title: "Test Proposal Forum",
  body: `This is a test proposal\n\n${actionsToYaml(actions)}`,
};

describe("PROPOSAL", () => {
  let uuid: string;
  // POST
  it("POST Discussion proposal", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/proposals")
      .set({ authorization: COAUTHOR, "override-space-info": JSON.stringify(overrideSpaceInfo) })
      .send({ proposal: { ...proposal, status: "Discussion" } });
    expect(response.status).toBe(200);
    expect(response.body.error).toBeUndefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.uuid).toBeDefined();
    expect(typeof response.body.data.uuid).toBe("string");
    uuid = response.body.data.uuid;
    await waitForDiscordURL(uuid);
  });

  // // GET
  // it("fetch proposalId", async () => {
  //   const { response } = await waitForDiscordURL(uuid);
  //   expect(response.status).toBe(200);
  //   expect(response.body.success).toBe(true);
  //   expect(response.body.data.discussionThreadURL).toBeDefined();
  //   expect(response.body.data.uuid).toBe(uuid);
  // });

  // // EDIT
  // it("edit proposalId 1", async () => {
  //   await sleep(1000); // discord wait
  //   // add another action to it
  //   actions.push({
  //     type: "Payout",
  //     uuid: uuidGen(),
  //     chainId: 1,
  //     pollRequired: true,
  //     payload: {
  //       project: 477,
  //       amount: 1,
  //       currency: "USD"
  //     }
  //   });
  //   const title = "EDITED";
  //   const body = `${trimActionsFromBody(proposal.body)}\n\n${actionsToYaml(actions)}`;
  //   const updatedProposal = { ...proposal, title, body };
  //   const response = await request(BASE_URL)
  //     .put(`/waterbox/proposal/${uuid}`)
  //     .set(headers)
  //     .send({ proposal: updatedProposal });
  //   expect(response.status).toBe(200);
  //   expect(response.body.success).toBe(true);
  // });

  // // set to archive as non author
  // it("non-author archive", async () => {
  //   const response = await request(BASE_URL)
  //     .put(`/waterbox/proposal/${uuid}`)
  //     .set({ authorization: COAUTHOR })
  //     .send({ proposal: { status: "Archived" } });
  //   expect(response.body.success).toBe(false);
  // });

  // it("set to invalid proposal status", async () => {
  //   const response = await request(BASE_URL)
  //     .put(`/waterbox/proposal/${uuid}`)
  //     .set(headers)
  //     .send({ proposal: { status: "invalid" } });
  //   expect(response.body.success).toBe(false);
  // });
});
