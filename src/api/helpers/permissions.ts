import { nanceAddress } from '../../keys';
import { GnosisHandler } from '../../gnosis/gnosisHandler';
import { STATUS } from '../../constants';

export const isMultisig = async (safeAddress: string, address: string) => {
  return GnosisHandler.getSigners(safeAddress).then((multisig) => {
    return multisig.includes(address);
  }).catch(() => { return false; });
};

export const isNanceAddress = (address: string) => {
  return address.toLowerCase() === nanceAddress.toLowerCase();
};

export const isNanceSpaceOwner = (spaceOwners: string[], address: string) => {
  return spaceOwners.includes(address);
};

export function canEditProposal(status: string) {
  return ([
    STATUS.DISCUSSION,
    STATUS.DRAFT,
    STATUS.TEMPERATURE_CHECK,
    STATUS.PRIVATE,
    STATUS.ARCHIVED,
    undefined,
  ].includes(status));
}
