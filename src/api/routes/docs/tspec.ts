import { Tspec } from "tspec";
import {
  Proposal,
  SpaceInfoResponse,
  ProposalsQueryResponse,
  ProposalUploadResponse,
  ProposalDeleteResponse,
  SpaceInfo,
  APIResponse,
  ActionPacket,
  ProposalStatus,
  ProposalUploadRequest,
} from "@nance/nance-sdk";

export type APIJBReconfigureFundingCycleData = {
  projectId: string;
  data: {
    duration: string,
    weight: string,
    discountRate:string,
    ballot: string
  };
  metadata: {
    global: {
      allowSetTerminals: boolean;
      allowSetController: boolean;
      pauseTransfers: boolean;
    };
    reservedRate: string;
    redemptionRate: string;
    ballotRedemptionRate: string;
    pausePay: boolean;
    pauseDistributions: boolean;
    pauseRedeem: boolean;
    pauseBurn: boolean;
    allowMinting: boolean;
    allowTerminalMigration: boolean;
    allowControllerMigration: boolean;
    holdFees: boolean;
    preferClaimedTokenOverride: boolean;
    useTotalOverflowForRedemptions: boolean;
    useDataSourceForPay: boolean;
    useDataSourceForRedeem: boolean;
    dataSource: string;
    metadata: string;
  };
  mustStartOnOrAfter: string;
  groupedSplits: string[];
  fundAccessConstraints: {
    terminal: string;
    token: string;
    distributionLimit: string;
    distributionLimitCurrency: string;
    overflowAllowance: string;
    overflowAllowanceCurrency: string;
  }[]
  memo: string;
};

interface APIErrorBase {
  success: false;
  error: string;
}

interface ProposalQueryResponseOverride extends Proposal {
  proposalInfo: {
    snapshotSpace: string;
    proposalIdPrefix: string;
    minTokenPassingAmount: number;
    nextProposalId: number;
  }
}

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
    },
    "/ish/uuid": {
      get: {
        tags: ["Nance System Info"]
        summary: "Get a v4 uuid",
        responses: {
          200: { success: true, data: string }
        }
      }
    }
  }
}>;

export type spaceSpec = Tspec.DefineApiSpec<{
  paths: {
    "/{space}": {
      get: {
        tags: ["Space Info"],
        summary: "Get information about a space",
        path: { space: string },
        responses: {
          200: SpaceInfoResponse;
          404: APIErrorBase;
        },
      }
    },
    "/{space}/cache/clear": {
      get: {
        tags: ["Space Info"],
        description: "Clear in memory cache for space",
        path: { space: string },
        responses: {
          200: { success: boolean };
          404: APIErrorBase;
        },
      }
    },
    "/{space}/reconfig": {
      get: {
        tags: ["Space Info"],
        summary: "Get Juicebox reconfig",
        description: "**Only enabled for `juicebox` space.** Gathers all active `Payout` actions, encodes them into a single Juicebox [`reconfigureFundingCyclesOf`](https://docs.juicebox.money/dev/api/contracts/or-controllers/jbcontroller3_1/#reconfigurefundingcyclesof), and returns encoded and decoded data."
        path: { space: string },
        responses: {
          200: {
            success: true,
            data: {
              encoded: string, decoded: APIJBReconfigureFundingCycleData
            }
          },
          404: APIErrorBase;
        }
      }
    },
    "/{space}/actions": {
      get: {
        tags: ["Space Actions"],
        description: "Get all actions that are NOT `Cancelled` or `Executed`. Query `?all=true` to get all actions.",
        query: { all?: true | undefined },
        path: { space: string },
        responses: {
          200: APIResponse<ActionPacket[]>
          404: APIErrorBase;
        }
      },
    }
    "/{space}/actions/{aid}": {
      get: {
        tags: ["Space Actions"],
        summary: "Get a specific action by action uuid (aid)",
        path: { space: string, aid: string },
        responses: {
          200: APIResponse<ActionPacket>;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/actions/{aid}/init": {
      get: {
        tags: ["Space Actions"],
        summary: "Initialize actionTracking for a specific action ID",
        description: "Initializes the `actionTracking` data structure for a specific action ID. Single `actionTracking` accounts for all actions within a proposal, all actions are intialized, not just the one specified. Results are saved to Nance database."
        path: { space: string, aid: string },
        responses: {
          200: APIResponse<string>;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/actions/{aid}/poll": {
      post: {
        tags: ["Space Actions"],
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
        tags: ["Space Proposals"],
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
        tags: ["Space Proposals"],
        summary: "Create a proposal in a space (requires SIWE JWT authentication or signed Proposal)",
        path: { space: string },
        security: "jwt",
        body: ProposalUploadRequest,
        responses: {
          200: ProposalUploadResponse;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/proposal/{proposalId}": {
      get: {
        tags: ["Space Single Proposal"],
        summary: "Get specific proposal by uuid, snapshotId, proposalId-#, or just proposalId #",
        path: { space: string, proposalId: string },
        responses: {
          200: APIResponse<ProposalQueryResponseOverride>;
          404: APIErrorBase;
        }
      },
      put: {
        tags: ["Space Single Proposal"],
        summary: "Update a proposal in a space",
        path: { space: string, proposalId: string },
        security: "jwt",
        body: Proposal,
        responses: {
          200: ProposalUploadResponse;
          404: APIErrorBase;
        }
      },
      delete: {
        tags: ["Space Single Proposal"],
        summary: "Delete a proposal in a space (most be spaceOwner, or proposal author)",
        path: { space: string, proposalId: string },
        security: "jwt",
        responses: {
          200: ProposalDeleteResponse;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/proposal/{proposalId}/status/{status}": {
      patch: {
        tags: ["Space Single Proposal"],
        summary: "Admin route to update the status of a Space Single Proposal",
        path: { space: string, proposalId: string, status: ProposalStatus },
        security: "jwt",
        responses: {
          200: ProposalUploadResponse;
          404: APIErrorBase;
        }
      }
    },
    "/{space}/proposal/{proposalId}/sync": {
      patch: {
        tags: ["Space Single Proposal"],
        summary: "Admin route to sync Snapshot results",
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
        tags: ["Space Single Proposal"],
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

export type aiSummarySpec = Tspec.DefineApiSpec<{
  basePath: "/{space}/{type}/{proposalId}",
  tags: ["Space Proposal AI Summary"],
  paths: {
    "/": {
      get: {
        summary: "AI summary of a specified proposal or discussion",
        description: "Uses [nancearizer](https://github.com/nance-eth/nancearizer) microservice. Fetches a summary of the proposal body when `proposal` type is specified or the Discord discussion thread if `thread` is specified. Summaries are saved in Nance database.",
        path: { space: string, type: "proposal" | "thread", proposalId: string },
        responses: {
          200: { success: true, data: string }
        }
      }
    }
  }
}>;

export type tasksSpec = Tspec.DefineApiSpec<{
  basePath: "/{space}/tasks",
  tags: ["Space Tasks"],
  security: "jwt",
  paths: {
    "/dailyAlert": {
      get: {
        summary: "Send Discord dailyAlert message",
        path: { space: string },
        responses: {
          200: { success: true }
        }
      }
    },
    "/incrementGovernanceCycle": {
      get: {
        summary: "Increment governance cycle",
        description: "Adds one to the currentCycle and saves it to the Nance database",
        path: { space: string },
        responses: {
          200: { success: true }
        }
      }
    },
    "/temperatureCheckStart": {
      get: {
        summary: "Start Temperature Check",
        description: "Gathers all `Discussion` proposals. Uses the next `Temperature Check` time according to the schedule. Sends rollup message to Discord.",
        path: { space: string },
        responses: {
          200: { success: true }
        }
      }
    },
    "/temperatureCheckClose": {
      get: {
        summary: "Close Temperature Check",
        description: "Closes the `Temperature Check`. Counts all polls and records results in Nance database. Passing proposals are set to `Voting`, failing to `Cancelled`.",
        path: { space: string },
        responses: {
          200: { success: true }
        }
      }
    },
    "/voteSetup": {
      get: {
        summary: "Setup Voting",
        description: "Gathers all `Voting` proposals that passed `Temperature Check` and uploads them to the space Snapshot. Record poll results and send rollup message to Discord.",
        path: { space: string },
        responses: {
          200: { success: true }
        }
      }
    },
    "/voteClose": {
      get: {
        summary: "Close Voting",
        description: "Checks Snapshot API results, passing proposals are set to `Approved`, failing are set to `Cancelled`. Record results in Nance database and send rollup to Discord.",
        path: { space: string },
        responses: {
          200: { success: true }
        }
      }
    },
    "/thread/reconfig": {
      post: {
        summary: "Send Juicebox project reconfiguration summary to Discord",
        description: "Gathers all active `Payout` actions, encodes them into a single Juicebox [`reconfigureFundingCyclesOf`](https://docs.juicebox.money/dev/api/contracts/or-controllers/jbcontroller3_1/#reconfigurefundingcyclesof), creates a Discord thread and sends a summary of the `Payout`'s that were added and removed since last cycle",
        path: { space: string },
        body: { safeTxnUrl?: string },
        responses: {
          200: { success: true }
        }
      }
    },
    "/thread/transactions": {
      post: {
        summary: "Send Transactions summary to Discord",
        description: "Accepts `actions` as list of action uuids. Gathers the proposals associated with those actions, creates a thread in Discord and sends a summary of each transaction.",
        path: { space: string },
        body: { actions: string[], safeTxnUrl?: string },
        responses: {
          200: { success: true }
        }
      }
    },
  }
}>;

export type commonSnapshotProposalSpec = Tspec.DefineApiSpec<{
  tags: ["Other"],
  paths: {
    "/snapshot/{snapshotId}": {
      get: {
        summary: "Fetch a proposal from Snapshot",
        description: "This queries the Snapshot API for the specified proposal, creates an AI summary for it and stores it in the `common` Nance database so it can be viewed by others without querying from Snapshot API again.",
        path: { snapshotId: string },
        responses: {
          200: APIResponse<ProposalQueryResponseOverride>
        }
      }
    }
  }
}>;
