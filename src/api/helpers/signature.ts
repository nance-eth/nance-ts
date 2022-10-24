import { ethers } from 'ethers';
import { DOMAIN, TYPES } from '../constants/Signature';
import { Signature } from '../../types';

const getApiPath = () => {
  console.log(process.env.RAILWAY_STATIC_URL);
  return `https://${process.env.RAILWAY_STATIC_URL}` || 'http://localhost:3000';
};

export function checkSignature(signaturePacket: Signature, space: string, command: string, payload: any) {
  const typedValue = {
    path: `${getApiPath()}/${space}/${command}`,
    timestamp: signaturePacket.timestamp,
    payload: ethers.utils.solidityKeccak256(['string'], [JSON.stringify(payload)])
  };
  try {
    const check = ethers.utils.verifyTypedData(DOMAIN, TYPES, typedValue, signaturePacket.signature);
    if (check === signaturePacket.address) return true;
  } catch {
    return false;
  }
  return false;
}
