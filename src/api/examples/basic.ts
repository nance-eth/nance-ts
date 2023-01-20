import axios from 'axios';
import {
  SpaceInfoResponse,
  ProposalsQueryResponse,
  ProposalMarkdownResponse,
  APIErrorResponse
} from '../models';

const API_STAGING = 'https://nance-ts-staging.up.railway.app';
const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

const SPACE = 'waterbox';
const PROPOSAL_HASH = '77758442f030434bb212d9b0300f0fc6';

const getSpaceInfo = async (space: string): Promise<SpaceInfoResponse | APIErrorResponse> => {
  return axios.get(`${API}/${space}`).then((response) => {
    return response.data;
  });
};

const queryProposals = async (space: string, cycle?: number): Promise<ProposalsQueryResponse | APIErrorResponse> => {
  return axios.get(`${API}/${space}/proposals${(cycle) ? `?cycle=${cycle}` : ''}`).then((response) => {
    return response.data;
  });
};

const queryMarkdown = async (space: string, hash: string): Promise<ProposalMarkdownResponse | APIErrorResponse> => {
  return axios.get(`${API}/${space}/proposal/${hash}`).then((response) => {
    return response.data;
  });
};

async function example() {
  const spaceInfoResponse = await getSpaceInfo(SPACE);
  const proposalsResponse = await queryProposals(SPACE);
  const specificProposalResponse = await queryMarkdown(SPACE, PROPOSAL_HASH);

  console.log(spaceInfoResponse);
  console.log(proposalsResponse);
  console.log(specificProposalResponse);
}

example();
