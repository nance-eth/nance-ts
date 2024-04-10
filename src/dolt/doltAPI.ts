import axios from 'axios';
import { keys } from '../keys';

const API = 'https://www.dolthub.com/api/v1alpha1';
const headers = { authorization: keys.DOLT_KEY };

export async function createDolthubDB(repoName: string) {
  const data = {
    description: `nance ${repoName} database. stores proposals, payouts, and other data.`,
    ownerName: 'nance',
    repoName,
    visibility: 'public',
  };
  return axios({
    method: 'post',
    url: `${API}/database`,
    headers,
    data
  }).then((res) => {
    return res.data;
  }).catch((e) => { return Promise.reject(e.response.data); });
}

export function headToUrl(repoOwner: string, repoName: string, head?: string) {
  return `https://www.dolthub.com/repositories/${repoOwner}/${repoName}${head ? `/compare/main/${head}` : ""}`;
}
