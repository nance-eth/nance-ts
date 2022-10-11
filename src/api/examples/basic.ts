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
const API = API_STAGING;

const SPACE = 'juicebox';
const PROPOSAL_HASH = '7dec578d23f84cfb8355c0c469389719';

const getSpaceInfo = async (space: string): Promise<SpaceInfoResponse | APIErrorResponse> => {
  return axios.get(`${API}/${space}`).then((response) => {
    return response.data;
  });
};

const queryProposals = async (space: string, cycle?: number): Promise<ProposalsQueryResponse | APIErrorResponse> => {
  return axios.get(`${API}/${space}/query${(cycle) ? `?cycle=${cycle}` : ''}`).then((response) => {
    return response.data;
  });
};

const queryMarkdown = async (space: string, hash: string): Promise<ProposalMarkdownResponse | APIErrorResponse> => {
  return axios.get(`${API}/${space}/markdown/?hash=${hash}`).then((response) => {
    return response.data;
  });
};

async function example() {
  const spaceInfo = await getSpaceInfo(SPACE);
  const proposals = await queryProposals(SPACE);
  const specificProposal = await queryMarkdown(SPACE, PROPOSAL_HASH);

  console.log(spaceInfo);
  console.log(proposals);
  console.log(specificProposal);
}

example();
