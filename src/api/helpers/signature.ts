import { ethers } from 'ethers';
import { DOMAIN, TYPES } from '../constants/Signature';
import { Signature } from '../../types';

const getPath = (space: string, command: string) => {
  const base = (process.env.RAILWAY_CUSTOM_URL) ? `https://${process.env.RAILWAY_CUSTOM_URL}` : 'http://localhost:3000';
  return `${base}/${space}/${command}`;
};

export function checkSignature(signaturePacket: Signature, space: string, command: string, payload: any) {
  const typedValue = {
    path: getPath(space, command),
    timestamp: signaturePacket.timestamp,
    payload: ethers.utils.solidityKeccak256(['string'], [JSON.stringify(payload)])
  };
  console.log(typedValue);
  try {
    const check = ethers.utils.verifyTypedData(DOMAIN, TYPES, typedValue, signaturePacket.signature);
    return { valid: check === signaturePacket.address, typedValue, signature: signaturePacket.signature };
  } catch {
    return { valid: false, typedValue, signature: signaturePacket.signature };
  }
}
