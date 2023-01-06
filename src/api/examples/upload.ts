import axios from 'axios';
import { ethers } from 'ethers';
import { Proposal, Signature } from '../../types';
import { DOMAIN, TYPES } from '../constants/Signature';
import {
  ProposalMarkdownResponse,
  APIErrorResponse
} from '../models';

const API_STAGING = 'https://api.staging.nance.app';
const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

const SPACE = 'yoohoo';
const PROPOSAL: Proposal = {
  hash: '',
  status: 'Draft',
  type: 'Payout',
  governanceCycle: undefined,
  proposalId: '',
  author: '',
  version: '1',
  title: 'newnenwenwe',
  // eslint-disable-next-line max-len
  body: 'Status: Draft\n\n```\nAuthor:\nDate: (YYYY-MM-DD)\n```\n\n## Synopsis\n\n*State what the proposal does in one sentence.*\n\n## Motivation\n\n*What problem does this solve? Why now?* \n\n## Specification\n\n*How exactly will this be executed? Be specific and leave no ambiguity.* \n\n## Rationale\n\n*Why is this specification appropriate?*\n\n## Risks\n\n*What might go wrong?*\n\n## Timeline\n\n*When exactly should this proposal take effect? When exactly should this proposal end?*',
  discussionThreadURL: '',
  ipfsURL: '',
  voteURL: '',
  url: '',
  payout: {
    type: 'address',
    count: 3,
    amountUSD: 1800,
    address: '0x25910143C255828F623786f46fe9A8941B7983bB',
    payName: 'testing123 payout'
  }
};

async function signPayload(space: string, command: string, payload: any): Promise<Signature> {
  const timestamp = Math.floor(Date.now() / 1000);
  const path = `${API}/${space}/${command}`;
  const typedValue = {
    path,
    timestamp,
    payload: ethers.utils.solidityKeccak256(['string'], [JSON.stringify(payload)])
  };
  const wallet = ethers.Wallet.createRandom();
  // eslint-disable-next-line no-underscore-dangle
  return wallet._signTypedData(DOMAIN, TYPES, typedValue).then((signature) => {
    return {
      address: wallet.address,
      signature,
      timestamp
    };
  });
}

async function uploadProposal(space: string, proposal: Proposal): Promise<ProposalMarkdownResponse | APIErrorResponse> {
  const signature = await signPayload(space, 'upload', proposal);
  return axios.post(`${API}/${space}/upload`, {
    signature,
    proposal
  }).then((response) => {
    return response.data;
  });
}

// upload
console.log('Upload proposal...');
uploadProposal(SPACE, PROPOSAL).then((res) => {
  console.log(res);
});
