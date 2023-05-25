/* eslint-disable class-methods-use-this */
import axios from 'axios';
import { ethers } from 'ethers';
import { BasicTransaction } from '../types';
import { keys } from '../keys';

// docs: https://docs-api.tenderly.co, https://docs.tenderly.co/simulations-and-forks/simulation-api
const BASE_API = 'https://api.tenderly.co/api/v1';
const DASHBOARD = 'https://dashboard.tenderly.co';

export type TenderlyConfig = { account: string, project: string };

export class TenderlyHandler {
  private provider!: ethers.providers.JsonRpcProvider;
  private API;
  private headers;
  private config;
  private forkId = '';

  constructor(
    config: TenderlyConfig
  ) {
    this.config = config;
    this.API = `${BASE_API}/account/${config.account}/project/${config.project}`;
    this.headers = { 'X-Access-Key': keys.TENDERLY_KEY };
  }

  getForkURL() {
    return `https://dashboard.tenderly.co/${this.config.account}/${this.config.project}/fork/${this.forkId}`;
  }

  async getForkProvider(description?: string) {
    const data = { network_id: '1', description };
    return axios({ method: 'POST', headers: this.headers, url: `${this.API}/fork`, data }).then(async (res) => {
      this.forkId = res.data.simulation_fork.id;
      const forkRPC = `https://rpc.tenderly.co/fork/${this.forkId}`;
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

  async sendTransaction(txn: BasicTransaction, from: string): Promise<string> {
    const params = [{
      to: txn.address,
      from,
      data: txn.bytes,
      gas: ethers.utils.hexValue(3000000),
      gasPrice: ethers.utils.hexValue(1),
      value: ethers.utils.hexValue(0)
    }];
    try {
      const hash = await this.provider.send('eth_sendTransaction', params); // returns transaction hash
      const res = await this.provider.send('eth_getTransactionReceipt', [hash]); // returns transaction receipt
      return res;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async simulate(txn: BasicTransaction, from: string): Promise<any> {
    const data = {
      network_id: '1',
      save: true,
      save_if_fails: true,
      from,
      to: txn.address,
      input: txn.bytes,
    };
    return axios({ method: 'POST', headers: this.headers, url: `${this.API}/simulate`, data }).then(async (res) => {
      return {
        simulationResults: res.data.transaction.status,
        url: `${DASHBOARD}/${this.config.account}/${this.config.project}/simulator/${res.data.simulation.id}`
      };
    });
  }
}
