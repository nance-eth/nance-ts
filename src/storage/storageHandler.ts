/* eslint-disable quote-props */
import axios from 'axios';
import FormData from 'form-data';
import { keys } from '../keys';

const API = 'https://ipfs.infura.io:5001/api/v0';

const AUTH_HEADER = `Basic ${Buffer.from(
  `${keys.INFURA_IPFS_ID}:${keys.INFURA_IPFS_SECRET}`,
).toString('base64')}`;

// https://github.com/jbx-protocol/juice-interface/blob/main/src/lib/infura/ipfs.ts
export async function dotPin(dataIn: string, encoding = 'utf-8' as BufferEncoding): Promise<string> {
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
    return res.data.Hash;
  }).catch((e) => {
    return Promise.reject(e);
  });
}
