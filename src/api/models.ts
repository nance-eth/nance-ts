import { NanceConfig, Proposal, Signature } from '../types';
import { SQLPayout } from '../dolt/schema';

interface APIResponse<T> {
  success: boolean;
  error: string;
  data: T;
}

export type SpaceInfo = {
  name: string,
  currentCycle: string
};

export type ProposalsQueryResponse = APIResponse<Proposal[]>;

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
  signature: Signature
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
  owners?: string[];
}

export interface EditPayoutsRequest extends BaseRequest {
  signature: Signature;
  payouts: SQLPayout[];
}
