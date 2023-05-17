import axios from 'axios';
import { signPayload, nanceWallet } from './helpers/signer';
import { Action, Proposal } from '../../types';

const API_STAGING = 'https://api.staging.nance.app';
const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

const SPACE = 'waterbox';
const uuid = '0dd665bac6794fa98e6d064fb3351e07';

async function main(space: string) {
  const proposal = (await axios.get(`${API}/${space}/proposal/${uuid}`)).data.data;
  console.log(proposal);
  const reserveActionIndex = proposal.actions.findIndex((action: Action) => { return action.type === 'Reserve'; });
  proposal.actions[reserveActionIndex].payload.splits[10].percent = 1;
  console.log(proposal);
  const signature = await signPayload(space, 'edit', proposal);
  console.log((await axios.put(`${API}/${space}/proposal/${proposal.hash}`, { signature, proposal })).data);
}

main('waterbox');
