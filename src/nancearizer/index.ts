import axios from "axios";
import { Proposal, ProposalQueryResponse } from "@nance/nance-sdk";

const API = process.env.NANCEARIZER_API_URL || "http://localhost:8080";

export const getSummary = async (space: string, id: string, type: "proposal" | "thread") => {
  const res = await axios.get(`${API}/${type}/${space}/${id}`);
  return res.data;
};

export const postSummary = async (proposal: Proposal, type: "proposal" | "thread") => {
  const proposalQueryResponse = {
    success: true,
    data: {
      ...proposal
    },
  } as ProposalQueryResponse;
  const res = await axios.post(`${API}/${type}`, proposalQueryResponse);
  return res.data;
};
