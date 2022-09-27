import axios from 'axios';
import { Proposal } from '../../types';

const API = 'http://127.0.0.1:3000';
const space = 'dev';
const proposal: Proposal = {
  hash: '',
  title: 'New Proposal by jigglyjams',
  // eslint-disable-next-line max-len
  markdown: 'Status: Draft\n\n```\nAuthor:\nDate: (YYYY-MM-DD)\n```\n\n## Synopsis\n\n*State what the proposal does in one sentence.*\n\n## Motivation\n\n*What problem does this solve? Why now?* \n\n## Specification\n\n*How exactly will this be executed? Be specific and leave no ambiguity.* \n\n## Rationale\n\n*Why is this specification appropriate?*\n\n## Risks\n\n*What might go wrong?*\n\n## Timeline\n\n*When exactly should this proposal take effect? When exactly should this proposal end?*',
  status: 'Draft',
  url: '',
  proposalId: '',
  discussionThreadURL: '',
  ipfsURL: '',
  voteURL: '',
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
    address: '0x25910143C255828F623786f46fe9A8941B7983bB'
  },
  category: 'Payout',
  version: 1,
  project: 1
};

async function uploadProposal() {
  axios.post(`${API}/notion/${space}/upload`, {
    space,
    proposal
  });
}

async function getProposal() {
  axios.get(`${API}/notion/${space}/getPage/c0d5a2f50601427e859d4fb1d408e7b2`);
}

async function getDiscussionProposals() {
  const temperatureCheckProposals = await axios.get(`${API}/notion/${space}/query/discussion`);
  console.log(temperatureCheckProposals.data);
}

async function getTemperatureCheckProposals() {
  const temperatureCheckProposals = await axios.get(`${API}/notion/${space}/query/temperatureCheck`);
  console.log(temperatureCheckProposals.data);
}

async function getVoteProposals() {
  const temperatureCheckProposals = await axios.get(`${API}/notion/${space}/query/vote`);
  console.log(temperatureCheckProposals.data);
}

uploadProposal();
