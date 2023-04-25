/* eslint-disable no-param-reassign */
import axios from 'axios';
import { Proposal } from '../../types';
import { signPayload } from './helpers/signer';
import {
  ProposalMarkdownResponse,
  APIErrorResponse
} from '../models';
import { getProposal } from './helpers/gpt';
import { uuid } from '../../utils';

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
  actions: [
    {
      type: 'Payout',
      name: 'jigglyjams',
      uuid: uuid(),
      payload: {
        type: 'address',
        count: 3,
        amountUSD: 1800,
        address: '0x25910143C255828F623786f46fe9A8941B7983bB',
        payName: 'testing123 payout'
      }
    },
    {
      type: 'Payout',
      name: 'jigglyjams project',
      uuid: uuid(),
      payload: {
        count: 3,
        amountUSD: 1800,
        project: 1
      }
    },
    {
      type: 'Transfer',
      name: 'jigglyjams transfer',
      uuid: uuid(),
      payload: {
        contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        tokenName: 'USDC',
        to: '0x25910143C255828F623786f46fe9A8941B7983bB',
        amount: '1000000'
      }
    },
    {
      type: 'Custom Transaction',
      name: 'jigglyjams custom transaction',
      uuid: uuid(),
      payload: {
        value: '0',
        contract: '0x97a5b9D9F0F7cD676B69f584F29048D0Ef4BB59b',
        functionName: 'burnTokensOf(address,uint256,uint256,string,bool)',
        args: {
          _projectId: '1',
          _tokenCount: '100',
          _memo: 'hi',
          _preferClaimedTokens: true,
          _holder: '0x25910143C255828F623786f46fe9A8941B7983bB'
        }
      }
    }
  ],
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
