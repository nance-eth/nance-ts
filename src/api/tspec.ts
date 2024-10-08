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
  ProposalStatus,
  ProposalUploadRequest,
} from "@nance/nance-sdk";

const exampleProposalUpload: ProposalUploadRequest = {
  proposal: {
    title: "This is the Title",
    body: "##Summary\n\nThis is the markdown body",
    status: "Discussion"
  }
};

interface APIErrorBase {
  success: false;
  error: string;
}

export const params: Tspec.GenerateParams = {
  openapi: {
    title: "Nance API",
    version: "1.0.0",
    securityDefinitions: {
      jwt: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "jwt",
      },
    }
  }
};

export type spaceSpec = Tspec.DefineApiSpec<{
  paths: {
    "/{space}": {
      get: {
        tags: ["Info"],
        summary: "Get information about a space",
        path: { space: string },
        responses: {
          200: SpaceInfoResponse;
          404: APIErrorBase;
        },
      }
    },
    "/{space}/actions": {
      get: {
        tags: ["Actions"],
        summary: "Get all actions that are NOT `Cancelled` or `Executed`",
        path: { space: string },
        responses: {
          200: APIResponse<ActionPacket[]>
          404: APIErrorBase;
        }
      }
    },
    "/{space}/actions/{aid}": {
      get: {
        tags: ["Actions"],
        summary: "Get a specific action by action uuid (aid)",
        path: { space: string, aid: string },
        responses: {
          200: APIResponse<ActionPacket>;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/actions/{aid}/poll": {
      post: {
        tags: ["Actions"],
        summary: "Run milestone poll for a proposal that requires one before being queued",
        description: "Stores and returns Discord poll URL in database"
        path: { space: string, aid: string },
        responses: {
          200: APIResponse<string>;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/proposals": {
      get: {
        tags: ["Proposals"],
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
        tags: ["Proposals"],
        summary: "Create a proposal in a space (requires SIWE JWT authentication or signed Proposal)",
        path: { space: string },
        security: "jwt",
        body: typeof exampleProposalUpload,
        responses: {
          200: ProposalUploadResponse;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/proposal/{proposalId}": {
      get: {
        tags: ["Single Proposal"],
        summary: "Get specific proposal by uuid, snapshotId, proposalId-#, or just proposalId #",
        path: { space: string, proposalId: string },
        responses: {
          200: ProposalQueryResponse;
          404: APIErrorBase;
        }
      },
      put: {
        tags: ["Single Proposal"],
        summary: "Update a proposal in a space",
        path: { space: string, proposalId: string },
        security: "jwt",
        body: Proposal,
        responses: {
          200: ProposalQueryResponse;
          404: APIErrorBase;
        }
      },
      delete: {
        tags: ["Single Proposal"],
        summary: "Delete a proposal in a space (most be spaceOwner, or proposal author)",
        path: { space: string, proposalId: string },
        security: "jwt",
        responses: {
          200: ProposalDeleteResponse;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/proposal/{proposalId}/status/{status}":{
      patch: {
        tags: ["Single Proposal"],
        summary: "Admin route to update the status of a single proposal",
        path: { space: string, proposalId: string, status: ProposalStatus },
        security: "jwt",
        responses: {
          200: ProposalUploadResponse;
          404: APIErrorBase;
        }
      }
    }
    "/{space}/proposal/{proposalId}/discussion": {
      get: {
        tags: ["Single Proposal"],
        summary: "create discussion and poll (used if it failed to automatically create)",
        path: { space: string, proposalId: string },
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
        tags: ["Nance System Info"]
        summary: "Get SpaceInfo for all spaces",
        responses: {
          200: { success: true, data: SpaceInfo[] }
        }
      }
    }
  }
}>;
