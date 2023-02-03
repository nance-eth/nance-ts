import axios from 'axios';
import { ethers } from 'ethers';
import { Signature } from '../../types';
import { DOMAIN, TYPES } from '../constants/Signature';
import { keys } from '../../keys';

const API_STAGING = 'https://api.staging.nance.app';
const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

async function signPayload(space: string, command: string, payload: any): Promise<Signature> {
  const timestamp = Math.floor(Date.now() / 1000);
  const path = `${API}/${space}/${command}`;
  const typedValue = {
    path,
    timestamp,
    payload: ethers.utils.solidityKeccak256(['string'], [JSON.stringify(payload)])
  };
  const wallet = new ethers.Wallet(keys.PRIVATE_KEY);
  // eslint-disable-next-line no-underscore-dangle
  return wallet._signTypedData(DOMAIN, TYPES, typedValue).then((signature) => {
    return {
      address: wallet.address,
      signature,
      timestamp
    };
  });
}

async function main(space: string, uuid: string) {
  const signature = await signPayload(space, 'delete', { uuid });
  console.log(signature);
  console.log((await axios.delete(`${API}/${space}/proposal/${uuid}`, { data: { signature } })).data);
}

main('waterbox', '5156fd85a7344e01be665cb858fa8b0e');
