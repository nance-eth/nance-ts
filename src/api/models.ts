import { DateEvent, GovernanceCycleForm, NanceConfig, Proposal, Signature } from '../types';
import { SQLPayout, DialogHandlerMessageIds } from '../dolt/schema';

interface APIResponse<T> {
  success: boolean;
  error?: string;
  data: T;
}

export type SpaceInfo = {
  name: string;
  currentCycle: number;
  currentEvent: DateEvent;
  spaceOwners: string[];
  snapshotSpace: string;
  juiceboxProjectId: string;
  transactorAddress?: {
    type: 'safe' | 'governor';
    network: string;
    address: string;
  }
  dolthubLink: string;
};

export type SpaceInfoExtended = SpaceInfo & {
  currentDay: number;
  cycleTriggerTime: string;
  dialog: DialogHandlerMessageIds;
  config: NanceConfig;
};

type ProposalInfo = {
  snapshotSpace: string;
  proposalIdPrefix: string;
  minTokenPassingAmount: number;
};

export type ProposalsPacket = { proposalInfo: ProposalInfo; proposals: Proposal[]; hasMore: boolean; };

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

export interface ProposalUploadRequest extends BaseRequest {
  proposal: Proposal;
}

export interface FetchReconfigureRequest extends BaseRequest {
  version: string;
  address: string;
  datetime: string;
  network: string;
}

export interface ConfigSpaceRequest extends BaseRequest {
  config: NanceConfig;
  owners: string[];
  cycleTriggerTime: string;
  cycleStageLengths: number[];
  governanceCycleForm: GovernanceCycleForm
  dryrun?: boolean;
}

export interface EditPayoutsRequest extends BaseRequest {
  payouts: SQLPayout[];
}
