/* eslint-disable no-await-in-loop */
import axios from 'axios';
import { request as gqlRequest } from 'graphql-request';
import { mutationDeleteBranch } from './doltGQL';
import { ReadResponse, WriteResponse, PollResponse } from './types';
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

  private async reader(endpoint?: string, params?: any): Promise<ReadResponse> {
    return axios({
      method: 'get',
      url: (endpoint) ? `${this.DOLT}/${endpoint}` : `${this.DOLT}`,
      headers: this.headers,
      params
    }).then((res) => {
      return res.data;
    }).catch((e) => {
      return e.response.data;
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
      return e;
    });
  }

  async metadata() {
    return this.reader();
  }

  async query(q: string) {
    return this.reader(undefined, { q });
  }

  async write(branch: string, q: string) {
    return this.writer(`main/${branch}`, q);
  }

  async merge(branch: string) {
    return this.writer(`${branch}/main`);
  }

  async poll(operationName: string) {
    let res;
    let done = false;
    while (!done) {
      res = await this.reader('write', { operationName }) as unknown as PollResponse;
      done = res.done;
      sleep(500);
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
