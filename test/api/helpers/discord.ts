/* eslint-disable no-await-in-loop */
import request from "supertest";
import { ProposalPacket } from "@nance/nance-sdk";
import { sleep } from "@/utils";
import { BASE_URL } from "../constants";

export const waitForDiscordURL = async (uuid: string, oldURL?: string, maxAttempts = 20, interval = 1000) => {
  for (let i = 0; i < maxAttempts; i += 1) {
    const response = await request(BASE_URL).get(`/waterbox/proposal/${uuid}`);
    const proposalReponse = response.body.data;
    const proposalPacket = proposalReponse as ProposalPacket;
    if (
      proposalPacket.discussionThreadURL !== "" &&
      proposalPacket.discussionThreadURL != null &&
      proposalPacket.discussionThreadURL !== oldURL
    ) {
      return { response, url: proposalPacket.discussionThreadURL };
    }
    console.log("waiting for url");
    await sleep(interval);
  }
  throw new Error("Discord URL not set within the expected time");
};
