import { Tspec } from "tspec";
import {
  Proposal,
  SpaceInfoResponse,
  ProposalsQueryResponse,
  ProposalQueryResponse,
  ProposalUploadResponse,
  ProposalDeleteResponse,
  SpaceInfo,
  APIResponse,
  ActionPacket,
} from "@nance/nance-sdk";

interface APIErrorBase {
  success: false;
  error: string;
}

export const params: Tspec.GenerateParams = {
  openapi: {
    title: "Nance API",
    version: "1.0.0",
  }
};

export type spaceSpec = Tspec.DefineApiSpec<{
  paths: {
    "/{space}": {
      get: {
        summary: "Get information about a space",
        path: { space: string },
        responses: {
          200: SpaceInfoResponse;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/actions": {
      get: {
        summary: "Get all actions that are NOT `Cancelled` or `Executed`",
        path: { space: string },
        responses: {
          200: APIResponse<Partial<ActionPacket[]>>
          404: APIErrorBase;
        }
      }
    },
    "/{space}/actions/{aid}": {
      get: {
        summary: "Get a specific action by action uuid (aid)",
        path: { space: string, aid: string },
        responses: {
          200: APIResponse<ActionPacket>;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/proposals": {
      get: {
        summary: "Get proposals for a space (defaults to current Governance Cycle)",
        path: { space: string },
        query: {
          cycle?: number,
          keyword?: number,
          author?: string,
          limit?: number,
          page?: number
        },
        responses: {
          200: ProposalsQueryResponse;
          404: APIErrorBase;
        }
      },
      post: {
        summary: "Create a proposal in a space (requires SIWE JWT authentication or signed Proposal",
        path: { space: string },
        body: Proposal,
        responses: {
          200: ProposalUploadResponse;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/proposal/{proposalId}": {
      get: {
        summary: "Get specific proposal by uuid, snapshotId, proposalId-#, or just proposalId #",
        path: { space: string, proposalId: string },
        responses: {
          200: ProposalQueryResponse;
          404: APIErrorBase;
        }
      },
      put: {
        summary: "Update a proposal in a space",
        path: { space: string, proposalId: string },
        body: Proposal,
        responses: {
          200: ProposalQueryResponse;
          404: APIErrorBase;
        }
      },
      delete: {
        summary: "Delete a proposal in a space (most be spaceOwner, or proposal author)",
        path: { space: string, proposalId: string },
        responses: {
          200: ProposalDeleteResponse;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/discussion/{uuid}": {
      get: {
        summary: "create discussion and poll (used if it failed to automatically create)",
        path: { space: string, uuid: string },
        responses: {
          200: { success: true, data: string },
          404: APIErrorBase;
        }
      }
    },
  }
}>;

export type nanceSpec = Tspec.DefineApiSpec<{
  paths: {
    "/ish/all": {
      get: {
        summary: "Get SpaceInfo for all spaces",
        responses: {
          200: { success: true, data: SpaceInfo[] }
        }
      }
    }
  }
}>;
