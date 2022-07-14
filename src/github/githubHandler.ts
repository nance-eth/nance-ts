import axios from 'axios';
import { stringToBase64 } from '../utils';

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
    }).catch((e) => { return e.response.data; });
  }

  async pushContent(filePath: string, content: string) {
    return axios({
      method: 'put',
      url: `${API}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
      data: {
        message: `create ${filePath}`,
        committer: {
          name: 'nance',
          email: 'nance@nance.app'
        },
        content: stringToBase64(content),
      },
      headers: this.HEADERS
    }).then((results) => {
      return results.data;
    }).catch((e) => { return e.response.data; });
  }
}
