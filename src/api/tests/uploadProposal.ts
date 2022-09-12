import axios from 'axios';
import { Proposal } from '../../types';

const API = 'http://127.0.0.1:3000';
const space = 'dev';
const proposal: Proposal = {
  title: 'Test proposal',
  category: 'Recurring Payment',
  governanceCycle: 32,
  hash: '',
  url: '',
  status: '',
  proposalId: '',
  discussionThreadURL: '',
  ipfsURL: '',
  voteURL: ''
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

uploadProposal();
