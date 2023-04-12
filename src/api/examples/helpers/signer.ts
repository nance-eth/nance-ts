import { ethers, Wallet } from 'ethers';
import { DOMAIN, TYPES } from '../../constants/Signature';
import { Signature } from '../../../types';
import { keys } from '../../../keys';

const getPath = (space: string, command: string) => {
  const base = (process.env.RAILWAY_CUSTOM_URL) ? `https://${process.env.RAILWAY_CUSTOM_URL}` : 'http://localhost:3000';
  return `${base}/${space}/${command}`;
};

export const nanceWallet = new ethers.Wallet(keys.PRIVATE_KEY);

export const dummyWallet = Wallet.fromMnemonic('candy maple cake sugar pudding cream honey rich smooth crumble sweet treat');

export async function signPayload(space: string, command: string, payload: any, signer?: Wallet): Promise<Signature> {
  const timestamp = Math.floor(Date.now() / 1000);
  const path = getPath(space, command);
  const typedValue = {
    path,
    timestamp,
    payload: ethers.utils.solidityKeccak256(['string'], [JSON.stringify(payload)])
  };
  const wallet = signer || dummyWallet;
  // eslint-disable-next-line no-underscore-dangle
  return wallet._signTypedData(DOMAIN, TYPES, typedValue).then((signature) => {
    return {
      address: wallet.address,
      signature,
      timestamp
    };
  });
}
