import { SpaceInfoExtended } from "@nance/nance-sdk";
import { DoltHandler } from "@/dolt/doltHandler";

export interface SpaceMiddleware extends SpaceInfoExtended {
  dolt: DoltHandler;
  address?: string;
  nextProposalId: number;
  dolthubLink: string;
}
