import axios from 'axios';
import logger from '../logging';
import { stringToBase64, base64ToString } from '../utils';

const API = 'https://api.github.com';

export class GithubHandler {
  private HEADERS;

  constructor(
    private auth_token: string,
    private owner: string,
    private repo: string
  ) {
    this.HEADERS = {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${this.auth_token}`
    };
  }

  async lastCommitSHA(branch = 'main'): Promise<any> {
    return axios({
      method: 'get',
      url: `${API}/repos/${this.owner}/${this.repo}/commits/${branch}`,
      headers: this.HEADERS
    }).then((response) => {
      return response.data.sha;
    }).catch((e) => { return Promise.reject(e.response.data); });
  }

  async getSHA(filePath: string) {
    return axios({
      method: 'get',
      url: `${API}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      headers: this.HEADERS
    }).then((results) => {
      return results.data.sha;
    }).catch((e) => { return Promise.reject(e.response.data); });
  }

  async getContent(filePath: string) {
    return axios({
      method: 'get',
      url: `${API}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      headers: this.HEADERS
    }).then((results) => {
      return base64ToString(results.data.content);
    }).catch((e) => { return Promise.reject(e.response.data); });
  }

  async pushContent(
    filePath: string,
    content: string,
    commitMessage = 'create file',
    shaString: string | null = null
  ): Promise<string> {
    return axios({
      method: 'put',
      url: `${API}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      data: {
        message: commitMessage,
        committer: {
          name: 'nance',
          email: 'nance@nance.app'
        },
        content: stringToBase64(content),
        sha: shaString
      },
      headers: this.HEADERS
    }).then((results) => {
      return results.data.content.html_url;
    }).catch((e) => { return Promise.reject(e.response.data); });
  }

  async updateContent(filePath: string, content: string): Promise<string> {
    const shaString = await this.getSHA(filePath);
    console.log(shaString);
    const url = this.pushContent(filePath, content, `update ${filePath}`, shaString);
    return url;
  }
}
