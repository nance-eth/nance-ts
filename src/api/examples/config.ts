import axios from 'axios';
import fs from 'fs';
import { signPayload } from '../helpers/signature';
import { getConfig, calendarPath } from '../../configLoader';
import { ConfigSpaceRequest } from '../models';

const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

async function createSpace(space: string) {
  const config = await getConfig(space);
  const calendar = fs.readFileSync(calendarPath(config), 'utf-8');
  const signature = await signPayload(space, 'config', { ...config, calendar });
  const req = { space, config, signature, calendar } as ConfigSpaceRequest;
  return axios.post(`${API}/ish/config`, req).then((res) => {
    return res.data;
  });
}

createSpace('juicebox').then((res) => {
  console.log(res);
});
