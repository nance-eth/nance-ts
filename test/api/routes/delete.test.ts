import request from "supertest";
import { BASE_URL, headers } from "../constants";
import { uuid } from "./proposals.test";

describe("DELETE proposal after all other tests", () => {
  it("delete it", async () => {
    const response = await request(BASE_URL)
      .delete(`/waterbox/proposal/${uuid}`)
      .set(headers);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
