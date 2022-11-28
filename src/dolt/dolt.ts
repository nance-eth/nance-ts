/* eslint-disable no-await-in-loop */
import axios from 'axios';
import { request as gqlRequest } from 'graphql-request';
import { mutationDeleteBranch } from './doltGQL';
import { DoltReadOptions, ReadResponse, WriteResponse, PollResponse } from './types';
import { sleep } from '../utils';

const API = 'https://www.dolthub.com/api/v1alpha1/';
const GRAPHQL_API = 'https://www.dolthub.com/graphql';

export class Dolt {
  private DOLT;
  private headers;
  private GQL_HEADERS;
  private repo;
  private owner;

  constructor(
    owner: string,
    repo: string,
    DOLT_KEY?: string
  ) {
    this.repo = repo;
    this.owner = owner;
    this.DOLT = `${API}/${owner}/${repo}`;
    this.headers = { authorization: `token ${DOLT_KEY}` };
    this.GQL_HEADERS = {
      Cookie: process.env.DOLT_COOKIE ?? ''
    };
  }

  private async reader(options?: DoltReadOptions): Promise<ReadResponse> {
    return axios({
      method: 'get',
      url: (options?.endpoint) ? `${this.DOLT}/${options?.endpoint}` : `${this.DOLT}/${options?.branch}`,
      headers: (options?.endpoint === 'write') ? this.headers : undefined,
      params: options?.params
    }).then((res) => {
      return res.data;
    }).catch((e) => {
      Promise.reject(e.response.data);
    });
  }

  private async writer(endpoint: string, q?: string): Promise<WriteResponse> {
    return axios({
      method: 'post',
      url: `${this.DOLT}/write/${endpoint}`,
      headers: this.headers,
      params: { q }
    }).then((res) => {
      return res.data;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async metadata() {
    return this.reader();
  }

  async query(query: string, branch?: string) {
    return this.reader({ branch, params: { q: query } });
  }

  async write(q: string, branch: string) {
    return this.writer(`main/${branch}`, q);
  }

  async merge(branch: string) {
    return this.writer(`${branch}/main`);
  }

  async poll(operationName: string, branch?: string) {
    let res;
    let done = false;
    while (!done) {
      res = await this.reader({ branch, endpoint: 'write', params: { operationName } }) as unknown as PollResponse;
      done = res.done;
      await sleep(500);
    }
    return res;
  }

  async delete(branch: string) {
    return gqlRequest(
      GRAPHQL_API,
      mutationDeleteBranch,
      { repoName: this.repo, ownerName: this.owner, branchName: branch },
      this.GQL_HEADERS
    );
  }
}
