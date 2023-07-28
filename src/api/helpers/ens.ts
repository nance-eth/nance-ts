import { ethers } from 'ethers';
import { keys } from '../../keys';

const RPC_HOST = `https://mainnet.infura.io/v3/${keys.INFURA_KEY}`;
const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);

export const getENS = async (address?: string) => {
  if (!address) return '';
  const ens = await provider.lookupAddress(address);
  if (ens) return ens;
  return address;
};
