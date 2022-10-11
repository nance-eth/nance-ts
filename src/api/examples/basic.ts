import axios from 'axios';
import {
  SpaceInfoResponse,
  ProposalsQueryResponse,
  ProposalMarkdownResponse,
  APIErrorResponse
} from '../models';
import { Proposal } from '../../types';

const API_STAGING = 'https://nance-ts-staging.up.railway.app';
const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

const SPACE = 'waterbox';
const PROPOSAL_HASH = '7dec578d23f84cfb8355c0c469389719';

const exampleProposal: Proposal = {
  hash: '',
  status: '',
  type: 'Payout',
  governanceCycle: 33,
  proposalId: '',
  author: '',
  version: 'V1',
  title: 'New Proposal by jigglyjams',
  // eslint-disable-next-line max-len
  body: 'Status: Draft\n\n```\nAuthor:\nDate: (YYYY-MM-DD)\n```\n\n## Synopsis\n\n*State what the proposal does in one sentence.*\n\n## Motivation\n\n*What problem does this solve? Why now?* \n\n## Specification\n\n*How exactly will this be executed? Be specific and leave no ambiguity.* \n\n## Rationale\n\n*Why is this specification appropriate?*\n\n## Risks\n\n*What might go wrong?*\n\n## Timeline\n\n*When exactly should this proposal take effect? When exactly should this proposal end?*',
  discussionThreadURL: '',
  ipfsURL: '',
  voteURL: '',
  url: '',
  notification: {
    discordUserId: '',
    expiry: false,
    execution: false,
    progress: false
  },
  payout: {
    type: 'address',
    count: 3,
    amountUSD: 1800,
    address: '0x25910143C255828F623786f46fe9A8941B7983bB',
  }
};

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

async function uploadProposal(space: string, proposal: Proposal): Promise<ProposalMarkdownResponse | APIErrorResponse> {
  return axios.post(`${API}/${space}/upload`, {
    proposal
  }).then((response) => {
    return response.data;
  });
}

async function example() {
  const spaceInfoResponse = await getSpaceInfo(SPACE);
  const proposalsResponse = await queryProposals(SPACE);
  const specificProposalResponse = await queryMarkdown(SPACE, PROPOSAL_HASH);

  console.log(spaceInfoResponse);
  console.log(proposalsResponse);
  console.log(specificProposalResponse);

  // upload proposal
  const uploadProposalResponse = await uploadProposal(SPACE, exampleProposal);
  console.log(uploadProposalResponse);
}

example();
