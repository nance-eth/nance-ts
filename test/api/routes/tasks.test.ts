import request from "supertest";
import { ADMIN, AUTHOR, BASE_URL, headers } from "../constants";
import { Action, actionsToYaml } from "@nance/nance-sdk";
import { uuidGen } from "@/utils";

const uuid = uuidGen();
const uuidA = uuidGen();
const uuidB = uuidGen();
const uuidC = uuidGen();

const actions: Action[] = [
  {
    type: "Transfer",
    uuid: uuidA,
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
    type: "Custom Transaction",
    uuid: uuidB,
    governanceCycles: [1],
    chainId: 1,
    payload: {
      value: "0",
      args: [
        {
          type: "address",
          name: "owner",
          value: "0x0000000000000000000000000000000000000000"
        },
        {
          value: "1",
          type: "uint256",
          name: "_threshold"
        }
      ],
      contract: "0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e",
      functionName: "function addOwnerWithThreshold(address owner, uint256 _threshold)",
      tenderlyId: ""
    },
  },
  {
    type: "Payout",
    uuid: uuidC,
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
  title: "Proposal for thread",
  body: `This is a test proposal for a trasaction thread\n\n${actionsToYaml(actions)}`,
  status: "Discussion",
};

describe("/tasks/thread/transactions", () => {
  it("create proposal", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/proposals")
      .set(headers)
      .send({ proposal });
    expect(response.body.success).toBe(true);
  });

  it("init action tracking", async () => {
    await request(BASE_URL)
      .get(`/waterbox/actions/${uuidA}/init`);
  });

  it("POST with bad auth", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/tasks/thread/transactions")
      .set({ authorization: AUTHOR })
      .send({ actions: [uuidA, uuidB] });
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it("POST with non transaction action", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/tasks/thread/transactions")
      .set({ authorization: ADMIN })
      .send({ actions: [uuidC] });
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it("POST with proper actions", async () => {
    const response = await request(BASE_URL)
      .post("/waterbox/tasks/thread/transactions")
      .set({ authorization: ADMIN })
      .send({ actions: [uuidA, uuidB] });
    expect(response.body.success).toBe(true);
    expect(response.body.error).toBeUndefined();
  });
});
