/* eslint-disable class-methods-use-this */
import axios from 'axios';
import { ethers } from 'ethers';
import { BasicTransaction } from '../types';

// docs: https://docs-api.tenderly.co, https://docs.tenderly.co/simulations-and-forks/simulation-api
const BASE_API = 'https://api.tenderly.co/api/v1';

export type TenderlyConfig = { account: string, project: string, key: string };

export class TenderlyHandler {
  private provider!: ethers.providers.JsonRpcProvider;
  private API;
  private headers;

  constructor(
    config: TenderlyConfig
  ) {
    this.API = `${BASE_API}/account/${config.account}/project/${config.project}`;
    this.headers = { 'X-Access-Key': config.key };
  }
  async getForkProvider(description: string) {
    const data = { network_id: '1', description };
    return axios({ method: 'POST', headers: this.headers, url: `${this.API}/fork`, data }).then(async (res) => {
      const forkId = res.data.simulation_fork.id;
      const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
      this.provider = new ethers.providers.JsonRpcProvider(forkRPC);
      return this.provider;
    }).catch((e) => {
      return Promise.reject(e.response.data);
    });
  }

  async advanceTime(seconds: number) {
    const time = ethers.utils.hexValue(seconds);
    await this.provider.send('evm_increaseTime', [time]);
  }

  async sendTransaction(txn: BasicTransaction, from: string) {
    const params = [{
      to: txn.address,
      from,
      data: txn.bytes,
      gas: ethers.utils.hexValue(3000000),
      gasPrice: ethers.utils.hexValue(1),
      value: ethers.utils.hexValue(0)
    }];
    await this.provider.send('eth_sendTransaction', params);
  }
}

// export async function simulateTxn(from: string, to: string, input: string) {
//   const data = {
//     network_id: '1',
//     from,
//     to,
//     input,
//     gas: 8000000,
//     gas_price: '0',
//     value: 0,
//     save_if_fails: true,
//     save: true,
//     simulation_type: 'quick'
//   };
//   return axios({
//     method: 'post',
//     headers: this.headers,
//     url: `${this.API}/simulate`,
//     data
//   });
// }
