import { ethers } from 'ethers';
import { DOMAIN, TYPES } from '../constants/Signature';
import { Signature } from '../../types';

export function checkSignature(signaturePacket: Signature) {
  try {
    const check = ethers.utils.verifyTypedData(DOMAIN, TYPES, signaturePacket.typedValue, signaturePacket.signature);
    if (check === signaturePacket.address) return true;
  } catch {
    return false;
  }
  return false;
}
