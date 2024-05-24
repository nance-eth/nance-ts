import { _TypedDataEncoder } from "ethers/lib/utils";
import {
  BasicNanceSignature,
  NanceSignatureTypesMap,
  SnapshotTypes,
  SnapshotUploadProposalEnvelope,
  archiveTypes,
  domain
} from "@nance/nance-sdk";

export const getSnapshotId = (envelope: BasicNanceSignature): string => {
  return _TypedDataEncoder.hash(domain, NanceSignatureTypesMap[envelope.type], envelope.message);
};

export const formatSnapshotEnvelope = (envelope: BasicNanceSignature): string => {
  const { type, address, signature, message } = envelope;
  let types;
  if (type === "SnapshotSubmitProposal") types = SnapshotTypes.proposalTypes;
  if (type === "SnapshotCancelProposal") types = SnapshotTypes.cancelProposal2Types;
  if (type === "NanceArchiveProposal") types = archiveTypes;
  if (!types) throw new Error("Invalid snapshot type");
  const snapshotEnvelope: SnapshotUploadProposalEnvelope = {
    address,
    sig: signature,
    data: { message: message as any, domain, types: types as any }
  };
  return JSON.stringify(snapshotEnvelope);
};
