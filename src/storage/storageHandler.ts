/* eslint-disable quote-props */
import axios from 'axios';
import path from 'path';
import { keys } from '../keys';

const TMP_DIR = path.join(__dirname, 'tmp');
const API = 'https://api.nft.storage';

export async function dotPin(dataIn: string, encoding = 'utf-8' as BufferEncoding): Promise<string> {
  const data = Buffer.from(dataIn, encoding);
  return axios({
    method: 'post',
    url: `${API}/upload`,
    headers: {
      'Authorization': `Bearer ${keys.STORAGE_KEY}`,
      'Content-Type': '*/*',
      'Accept-Encoding': '*',
      'Content-Length': data.length
    },
    data
  }).then((res) => {
    return res.data.value.cid;
  }).catch((e) => {
    return Promise.reject(e);
  });
}
