import request from "supertest";
import { BASE_URL } from "../constants";

describe("Space Info", () => {
  it("should return the space info", async () => {
    const response = await request(BASE_URL).get("/waterbox");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("waterbox");
  });

  it("should handle missing space scenario", async () => {
    const response = await request(BASE_URL).get("/nonexistentspace");

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("space nonexistentspace not found");
  });
});
