import request from "supertest";
import { BASE_URL, headers } from "../constants";

const testName = "spacejam";

describe("System Routes", () => {
  describe("Space Creation", () => {
    const testConfig = {
      name: testName,
      proposalIdPrefix: "TST",
    };

    const testSpaceOwners = [{
      address: "0x1234567890123456789012345678901234567890",
    }];

    it("should create a new space", async () => {
      const response = await request(BASE_URL)
        .post("/ish/config")
        .set(headers)
        .send({
          config: testConfig,
          spaceOwners: testSpaceOwners,
        });

      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.space).toBe(testName);
    });

    it("should fail without authorization header", async () => {
      const response = await request(BASE_URL)
        .post("/ish/config")
        .send({
          config: testConfig,
          spaceOwners: testSpaceOwners,
          dryrun: false
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("no SIWE address found");
    });

    // it("should validate space configuration", async () => {
    //   const invalidConfig = {
    //     ...testConfig,
    //     name: "" // Invalid empty name
    //   };

    //   const response = await request(BASE_URL)
    //     .post("/system/config")
    //     .set(headers)
    //     .send({
    //       config: invalidConfig,
    //       spaceOwners: testSpaceOwners,
    //       dryrun: false
    //     });

    //   expect(response.body.success).toBe(false);
    // });
  });
});
