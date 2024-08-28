import { _TypedDataEncoder } from "ethers/lib/utils";
import {
  BasicNanceSignature,
  SnapshotUploadProposalEnvelope,
  domain,
  nanceSignatureMap
} from "@nance/nance-sdk";
import { dotPin } from "@/storage/storageHandler";
import { addressFromSignature } from "./auth";

export const getSnapshotId = (envelope: BasicNanceSignature): string => {
  const { types } = nanceSignatureMap[envelope.type];
  return _TypedDataEncoder.hash(domain, types, envelope.message);
};

export const formatSnapshotEnvelope = (envelope: BasicNanceSignature): string => {
  const { type, address, signature, message } = envelope;
  const types = nanceSignatureMap[type];
  const snapshotEnvelope: SnapshotUploadProposalEnvelope = {
    address,
    sig: signature,
    data: { message: message as any, domain, types: types as any }
  };
  return JSON.stringify(snapshotEnvelope);
};

export async function validateUploaderAddress(
  address?: string,
  envelope?: BasicNanceSignature
) {
  if ((!envelope && !address) || !address) {
    throw Error("no address or envelope provided for proposal upload/edit");
  }
  if (envelope && !address) {
    const uploaderAddress = address || envelope?.address;
    const decodedAddress = await addressFromSignature(envelope);
    if (decodedAddress !== envelope.address) {
      throw Error(`Address mismatch: got ${decodedAddress} for ${envelope.address} signature: ${envelope.signature}`);
    }
    // predetermine snapshotId
    // this allows us to upload the proposal and have proper authorship displayed on snapshot.org
    const receipt = await dotPin(formatSnapshotEnvelope(envelope));
    const snapshotId = getSnapshotId(envelope);
    return { uploaderAddress, receipt, snapshotId };
  }
  return { uploaderAddress: address };
}
