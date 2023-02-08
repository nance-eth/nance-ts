import axios from 'axios';
import { signPayload } from '../helpers/signature';
import { getConfig } from '../../configLoader';
import { CreateSpaceRequest } from '../models';

const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

async function createSpace(space: string) {
  const config = await getConfig(space);
  const signature = await signPayload(space, 'config', config);
  const req = { space, config, signature } as CreateSpaceRequest;
  return axios.post(`${API}/ish/config`, req).then((res) => {
    return res.data;
  });
}

createSpace('juicebox').then((res) => {
  console.log(res);
});
