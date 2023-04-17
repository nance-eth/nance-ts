/* eslint-disable no-param-reassign */
import axios from 'axios';
import { Proposal } from '../../types';
import { signPayload } from './helpers/signer';
import {
  ProposalMarkdownResponse,
  APIErrorResponse
} from '../models';
import { getProposal } from './helpers/gpt';

const API_STAGING = 'https://api.staging.nance.app';
const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

const SPACE = 'waterbox';
const PROPOSAL: Proposal = {
  hash: '',
  status: 'Discussion',
  type: 'Payout',
  governanceCycle: undefined,
  proposalId: null,
  title: '',
  discussionThreadURL: '',
  ipfsURL: '',
  voteURL: '',
  url: '',
  actions: [{
    type: 'Payout',
    name: 'jigglyjams',
    payload: {
      type: 'address',
      count: 3,
      amountUSD: 1800,
      address: '0x25910143C255828F623786f46fe9A8941B7983bB',
      payName: 'testing123 payout'
    }
  }],
};

async function uploadProposal(space: string, proposal: Proposal): Promise<ProposalMarkdownResponse | APIErrorResponse> {
  const gptProposal = await getProposal().then((res) => {
    if (res) {
      const regex = /^(#{1,2})\s(.*)$/m;
      const title = res.match(regex);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return { body: res, title: title![2] || 'DEFAULT' };
    }
    throw Error();
  });
  proposal.body = gptProposal.body;
  proposal.title = gptProposal.title;
  const signature = await signPayload(space, 'upload', proposal);
  return axios.post(`${API}/${space}/proposals`, {
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
