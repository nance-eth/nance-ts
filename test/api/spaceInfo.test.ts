import request from "supertest";
import { init, shutdown } from "@/api/index";
import { sleep } from "@/utils";
import { closePools } from "@/dolt/pools";

const BASE_URL = "http://localhost:3003";

describe("Integration Tests", () => {
  it("should return the space info", async () => {
    const response = await request(BASE_URL).get("/waterbox");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("waterbox");
  });

  it("should handle missing space scenario", async () => {
    const response = await request(BASE_URL)
      .get("/nonexistentspace");

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("space nonexistentspace not found");
  });

  // Add more tests as needed
});
