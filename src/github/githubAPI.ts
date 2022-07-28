import axios from 'axios';
import { request as gqlRequest, gql } from 'graphql-request';
import logger from '../logging';
import { stringToBase64, base64ToString } from '../utils';
import { mutationCommitAndPush } from './githubHelper';
import { GithubFileChange } from '../types';

const REST_API = 'https://api.github.com';
const GQL_API = 'https://api.github.com/graphql';

export class GithubAPI {
  private REST_HEADERS;
  private GQL_HEADERS;

  constructor(
    private auth_token: string,
    private owner: string,
    private repo: string,
  ) {
    this.REST_HEADERS = {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${this.auth_token}`
    };

    this.GQL_HEADERS = {
      Authorization: `bearer ${this.auth_token}`
    };
  }

  async getOid(branch = 'main'): Promise<string> {
    return axios({
      method: 'get',
      url: `${REST_API}/repos/${this.owner}/${this.repo}/commits/${branch}`,
      headers: this.REST_HEADERS
    }).then((response) => {
      return response.data.sha;
    }).catch((e) => { return Promise.reject(e.response.data); });
  }

  async getSHA(filePath: string) {
    return axios({
      method: 'get',
      url: `${REST_API}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      headers: this.REST_HEADERS
    }).then((results) => {
      return results.data.sha;
    }).catch((e) => { return Promise.reject(e.response.data); });
  }

  async getContent(filePath: string) {
    return axios({
      method: 'get',
      url: `${REST_API}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      headers: this.REST_HEADERS
    }).then((results) => {
      return base64ToString(results.data.content);
    }).catch((e) => { return Promise.reject(e.response.data); });
  }

  async createCommitOnBranch(files: GithubFileChange[], message: string): Promise<string> {
    const variables = {
      ownerSlashRepo: `${this.owner}/${this.repo}`,
      branch: 'main',
      commitMessage: message,
      fileChanges: {
        additions:
          files.map((file) => {
            return {
              path: file.path,
              contents: stringToBase64(file.contents)
            };
          }),
      },
      expectedOid: await this.getOid()
    };
    return gqlRequest(
      GQL_API,
      mutationCommitAndPush,
      variables,
      this.GQL_HEADERS
    ).then((response) => {
      return response.createCommitOnBranch.commit.oid;
    }).catch((e) => {
      Promise.reject(e);
    });
  }
}
