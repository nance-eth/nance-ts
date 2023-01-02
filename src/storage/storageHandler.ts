/* eslint-disable quote-props */
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { keys } from '../keys';
import { Proposal } from '../types';

const TMP_DIR = path.join(__dirname, 'tmp');
const API = 'https://api.nft.storage';

function appendHeading(proposal: Proposal) {
  return `# ${proposal.proposalId} - ${proposal.title}${proposal.body}`;
}

async function uploadRequest(fileName: string): Promise<string> {
  return axios({
    method: 'post',
    url: `${API}/upload`,
    headers: {
      'Authorization': `Bearer ${keys.STORAGE_KEY}`,
      'Content-Type': '*/*',
      'Accept-Encoding': '*',
      'Content-Length': fs.statSync(fileName).size
    },
    data: fs.createReadStream(fileName)
  }).then((res) => {
    fs.rm(fileName, () => {});
    return res.data.value.cid;
  }).catch((e) => {
    return Promise.reject(e);
  });
}

export async function pinProposal(proposal: Proposal): Promise<string> {
  const fileName = path.join(TMP_DIR, `${proposal.hash}.md`);
  fs.writeFileSync(fileName, appendHeading(proposal));
  return uploadRequest(fileName);
}
