import axios from 'axios';
import { signPayload } from './signer';
import { getConfig, getCalendar } from '../../configLoader';
import { ConfigSpaceRequest } from '../models';

const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

async function configSpace(space: string) {
  const config = await getConfig(space);
  const calendar = getCalendar(config);
  const signature = await signPayload(space, 'config', { ...config, calendar });
  const req = { space, config, signature, calendar } as ConfigSpaceRequest;
  return axios.post(`${API}/ish/config`, req).then((res) => {
    return res.data;
  });
}

configSpace('waterbox').then((res) => {
  console.log(res);
});
