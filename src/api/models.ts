import { DateEvent, NanceConfig, Proposal, Signature } from '../types';
import { SQLPayout, DialogHandlerMessageIds } from '../dolt/schema';

interface APIResponse<T> {
  success: boolean;
  error: string;
  data: T;
}

export type SpaceInfo = {
  name: string;
  currentCycle: number;
  currentEvent: DateEvent;
  snapshotSpace: string;
  juiceboxProjectId: string;
  dolthubLink: string;
};

export type SpaceAuto = Pick<SpaceInfo, 'name' | 'currentCycle' | 'currentEvent'> & {
  currentDay: number;
  totalCycleDays: number;
  cycleDayLastUpdated: Date;
  cycleTriggerTime: string;
  nextEvent: DateEvent;
  dialog: DialogHandlerMessageIds;
  config: NanceConfig;
};

type ProposalInfo = {
  snapshotSpace: string;
  proposalIdPrefix: string;
  minTokenPassingAmount: number;
};

export type ProposalsPacket = { proposalInfo: ProposalInfo, proposals: Proposal[], privateProposals: Proposal[] };

export type ProposalsQueryResponse = APIResponse<ProposalsPacket>;

export type ProposalMarkdownResponse = APIResponse<Proposal>;

export type PayoutsQueryResponse = APIResponse<SQLPayout[]>;

export type SpaceInfoResponse = APIResponse<SpaceInfo>;

export type APIErrorResponse = APIResponse<undefined>;

interface BaseRequest {
  space: string;
}

export interface SpaceProposalRequest extends BaseRequest {
  cycle: number | undefined;
}

export type SpaceInfoRequest = BaseRequest;

export interface ProposalMarkdownRequest extends BaseRequest {
  hash: string;
}

export interface ProposalUploadRequest extends BaseRequest {
  proposal: Proposal;
}

export interface ProposalDeleteRequest extends BaseRequest {
  uuid: string;
  signature: Signature
}

export interface IncrementGovernanceCycleRequest extends BaseRequest {
  governanceCycle: string;
  signature: Signature
}

export interface FetchReconfigureRequest extends BaseRequest {
  version: string;
  address: string;
  datetime: string;
  network: string;
}

export interface SubmitTransactionRequest extends BaseRequest {
  version: string;
  datetime: string;
  signature: Signature
}

export interface ConfigSpaceRequest extends BaseRequest {
  signature: Signature;
  config: NanceConfig;
  calendar?: string;
  owners: string[];
  cycleCurrentDay: number;
  cycleTriggerTime: string;
  cycleStageLengths: number[];
  dryrun?: boolean;
}

export interface EditPayoutsRequest extends BaseRequest {
  signature: Signature;
  payouts: SQLPayout[];
}
