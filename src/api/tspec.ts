import { Tspec } from 'tspec';
import { Proposal } from '../types';
import {
  SpaceInfoResponse,
  ProposalsQueryResponse,
  ProposalQueryResponse,
  ProposalUploadResponse,
  ProposalDeleteResponse,
  SpaceInfo,
} from './models';

interface APIErrorBase {
  success: false;
  error: string;
}

export type spaceSpec = Tspec.DefineApiSpec<{
  openapi: {
    title: 'Nance API';
  }
  paths: {
    '/{space}': {
      get: {
        summary: 'Get information about a space',
        path: { space: string },
        responses: {
          200: SpaceInfoResponse;
          400: APIErrorBase & { error: '[NANCE ERROR]: space {space} not found' }
        }
      }
    },
    '/{space}/proposals': {
      get: {
        summary: 'Get proposals for a space (defaults to current Governance Cycle)',
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
          400: APIErrorBase & { error: '[NANCE ERROR]: space {space} not found' }
        }
      },
      post: {
        summary: 'Create a proposal in a space',
        path: { space: string },
        body: Proposal,
        responses: {
          200: ProposalUploadResponse;
          400: APIErrorBase & { error: '[DATABASE ERROR]: ...' }
        }
      }
    },
    '/{space}/proposal/{proposalId}': {
      get: {
        summary: 'Get specific proposal by uuid, snapshotId, proposalId-#, or just proposalId #',
        path: { space: string, proposalId: string },
        responses: {
          200: ProposalQueryResponse;
          400: APIErrorBase & { error: '[NANCE ERROR]: proposal not found' }
        }
      },
      put: {
        summary: 'Update a proposal in a space',
        path: { space: string, proposalId: string },
        body: Proposal,
        responses: {
          200: ProposalQueryResponse;
          400: APIErrorBase & { error: '[NANCE ERROR]: proposal not found' }
        }
      },
      delete: {
        summary: 'Delete a proposal in a space (most be spaceOwner, or proposal author)',
        path: { space: string, proposalId: string },
        responses: {
          200: ProposalDeleteResponse;
          400: APIErrorBase & { error: '[PERMISSIONS] User not authorized to delete proposal' }
        }
      }
    },
    '/{space}/discussion/{uuid}': {
      get: {
        summary: 'create discussion and poll (used if it failed to automatically create)',
        path: { space: string, uuid: string },
        responses: {
          200: { success: true, data: string },
          400: APIErrorBase & { error: 'proposal already has a discussion created' }
        }
      }
    },
  }
}>;

export type nanceSpec = Tspec.DefineApiSpec<{
  paths: {
    '/ish/all': {
      get: {
        summary: 'Get SpaceInfo for all spaces',
        responses: {
          200: { success: true, data: SpaceInfo[] }
        }
      }
    }
  }
}>;
