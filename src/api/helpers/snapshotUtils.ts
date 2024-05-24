import { _TypedDataEncoder } from "ethers/lib/utils";
import {
  BasicNanceSignature,
  SnapshotUploadProposalEnvelope,
  domain,
  nanceSignatureMap
} from "@nance/nance-sdk";

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
