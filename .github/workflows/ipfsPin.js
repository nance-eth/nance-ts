import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API = 'https://ipfs.infura.io:5001/api/v0';

const AUTH_HEADER = `Basic ${Buffer.from(
  `${process.env.INFURA_IPFS_ID}:${process.env.INFURA_IPFS_SECRET}`,
).toString('base64')}`;

// https://github.com/jbx-protocol/juice-interface/blob/main/src/lib/infura/ipfs.ts
async function dotPin(dataIn, encoding = 'utf-8') {
  const data = Buffer.from(dataIn, encoding);
  const formData = new FormData();
  formData.append('file', data);
  return axios({
    method: 'post',
    url: `${API}/add`,
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': 'multipart/form-data',
    },
    data: formData
  }).then((res) => {
    const cid = res.data.Hash;
    console.log(`IPFS CID: ${cid}`);
    return cid;
  }).catch((e) => {
    return Promise.reject(e);
  });
}

async function main() {
  const file = fs.readFileSync(process.argv[2]);
  await dotPin(file);
}

main();