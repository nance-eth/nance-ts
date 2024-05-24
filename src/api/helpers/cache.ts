import { ProposalsPacket, SpaceInfoExtended } from "@nance/nance-sdk";

type Cache = {
  spaceInfo?: SpaceInfoExtended;
  nextProposalId?: number;
  proposalsPacket?: Record<string, ProposalsPacket>;
};

export const cache = {} as Record<string, Cache>;

export const clearCache = (space: string) => {
  cache[space] = {};
};
