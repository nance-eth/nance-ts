/* eslint-disable no-param-reassign */
import axios from 'axios';
import { Proposal } from '../../types';
import { signPayload } from './helpers/signer';
import {
  ProposalMarkdownResponse,
  APIErrorResponse
} from '../models';
import { getProposal } from './helpers/gpt';
import { uuidGen } from '../../utils';

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
      uuid: uuidGen(),
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
      uuid: uuidGen(),
      payload: {
        count: 3,
        amountUSD: 1800,
        project: 1
      }
    },
    {
      type: 'Transfer',
      name: 'jigglyjams transfer',
      uuid: uuidGen(),
      payload: {
        contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        tokenName: 'USDC',
        to: '0x25910143C255828F623786f46fe9A8941B7983bB',
        amount: '1000000',
        decimals: 6
      }
    },
    {
      type: 'Custom Transaction',
      name: 'jigglyjams custom transaction',
      uuid: uuidGen(),
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
    },
    {
      type: 'Reserve',
      name: 'jigglyjams reserve',
      uuid: uuidGen(),
      payload: {
        splits: [
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x6860f1A0cF179eD93ABd3739c7f6c8961A4EEa3c',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x428f196c4D754A96642854AC5d9f29a0e6eC707E',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xA8488938161c9Afa127E93Fef6d3447051588664',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x63A2368F4B509438ca90186cb1C15156713D5834',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 300000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xE16a238d207B9ac8B419C7A866b0De013c73357B',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x25910143C255828F623786f46fe9A8941B7983bB',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xF8284136B169213E4c50cE09f3E1D9A9b484BAea',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x30670D81E487c80b9EDc54370e6EaF943B6EAB39',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xca6Ed3Fdc8162304d7f1fCFC9cA3A81632d5E5B0',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xA99c384f43e72B65BB51fE33b85CE12A32C09526',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xe7879a2D05dBA966Fcca34EE9C3F99eEe7eDEFd1',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x28C173B8F20488eEF1b0f48Df8453A2f59C38337',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x334d080349dA9CFa602442968483B761defA5bF7',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xC0b8eed3314B625d0c4eBC5432a5bd4f31370B4d',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x90eda5165e5E1633E0Bdb6307cDecaE564b10ff7',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x21a8c5f5666EC3b786585EABc311D9de18A5Db6C',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xa13d49fCbf79EAF6A0a58cBDD3361422DB4eAfF1',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xb045708e396E20071324C1aed2E4CFB90A0764FE',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xf0FE43a75Ff248FD2E75D33fa1ebde71c6d1abAd',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x123a3c28eB9e701C173D3A73412489f3554F3005',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0xFda746F4C3f9F5A02b3E63ed6d0eBBc002d1f788',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x5706d5aD7A68bf8692bD341234bE44ca7Bf2f654',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x34724D71cE674FcD4d06e60Dd1BaA88c14D36b75',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x111040F27f05E2017e32B9ac6d1e9593E4E19A2a',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          },
          {
            percent: 28000000,
            allocator: '0x0000000000000000000000000000000000000000',
            projectId: 0,
            beneficiary: '0x2DdA8dc2f67f1eB94b250CaEFAc9De16f70c5A51',
            lockedUntil: 0,
            preferClaimed: false,
            preferAddToBalance: false
          }
        ]
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
