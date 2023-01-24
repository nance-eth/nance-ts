/* eslint-disable class-methods-use-this */
import axios from 'axios';
import { keys } from '../keys';

const API = 'https://api.tenderly.co/api/v1/account/jigglyjams/project/nance';
const headers = { 'X-Access-Key': keys.TENDERLY_KEY };

export class TenderlyHandler {
  async createFork(description: string) {
    const data = { network_id: '1', description };
    return axios({ method: 'POST', headers, url: `${API}/fork`, data }).then(async (res) => {
      return res.data.simulation_fork.id;
    }).catch((e) => {
      return Promise.reject(e.response.data);
    });
  }
}

export async function simulateTxn(from: string, to: string, input: string) {
  const data = {
    network_id: '1',
    from,
    to,
    input,
    gas: 8000000,
    gas_price: '0',
    value: 0,
    save_if_fails: true,
    save: true,
    simulation_type: 'quick'
  };
  return axios({
    method: 'post',
    headers,
    url: `${API}/simulate`,
    data
  });
}
