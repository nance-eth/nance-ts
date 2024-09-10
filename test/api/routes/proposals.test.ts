import request from "supertest";
import { AUTHOR, BASE_URL } from "../constants";

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
    console.log(response.body)
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    uuid = response.body.data.uuid;
    expect(response.body.data.uuid).toBeDefined();
    expect(typeof response.body.data.uuid).toBe("string");
  });

  // GET
  it("fetch proposalId", async () => {
    const response = await request(BASE_URL).get(`/waterbox/proposal/${uuid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.uuid).toBe(uuid);
  });

  // EDIT
  it("edit proposalId 1", async () => {
    const response = await request(BASE_URL)
      .put(`/waterbox/proposal/${uuid}`)
      .set(headers)
      .send({ proposal: { title: "EDITED" } });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // DELETE
  it("delete proposal", async () => {
    const response = await request(BASE_URL)
      .delete(`/waterbox/proposal/${uuid}`)
      .set(headers);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
