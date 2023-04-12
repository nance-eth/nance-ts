import axios from 'axios';
import { nanceWallet, signPayload } from './helpers/signer';
import { getConfig, getCalendar } from '../../configLoader';
import { ConfigSpaceRequest } from '../models';

const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

async function configSpace(space: string) {
  const config = await getConfig(space);
  const calendar = getCalendar(config);
  const owners = ['0x25910143C255828F623786f46fe9A8941B7983bB', '0xca6Ed3Fdc8162304d7f1fCFC9cA3A81632d5E5B0'];
  const signature = await signPayload('ish', 'config', { ...config, calendar, owners }, nanceWallet);
  const req = { config, signature, calendar, owners } as ConfigSpaceRequest;
  return axios.post(`${API}/ish/config`, req).then((res) => {
    return res.data;
  });
}

configSpace('waterbox').then((res) => {
  console.log(res);
});
