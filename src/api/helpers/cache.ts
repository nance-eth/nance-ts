import { ProposalsPacket, SpaceInfoExtended } from "@nance/nance-sdk";

type Cache = {
  spaceInfo?: SpaceInfoExtended;
  nextProposalId?: number;
  dolthubLink?: string;
  proposalsPacket?: Record<string, ProposalsPacket>;
};

export const cache = {} as Record<string, Cache>;

export const clearCache = (space: string) => {
  cache[space] = {};
};

export const findCacheProposal = (space: string, pid: string) => {
  if (!cache[space].proposalsPacket) return undefined;
  const packets = Object.values(cache[space].proposalsPacket as Record<string, ProposalsPacket>);
  const proposals = packets.map((p) => p.proposals).flat();
  return proposals.find((p) => p.uuid === pid || p.voteURL === pid || p.proposalId === Number(pid));
};
