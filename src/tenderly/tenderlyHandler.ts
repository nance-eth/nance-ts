/* eslint-disable class-methods-use-this */
import axios from 'axios';
import { ethers } from 'ethers';
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

  getForkURL(shared = true) {
    if (!shared) return `https://dashboard.tenderly.co/${this.config.account}/${this.config.project}/fork/${this.forkId}`;
    return `https://dashboard.tenderly.co/explorer/fork/${this.forkId}`;
  }

  async getForkProvider(description?: string, forkId?: string) {
    const data = { network_id: '1', description, shared: true };
    if (forkId) {
      this.forkId = forkId;
      const forkRPC = `https://rpc.tenderly.co/fork/${this.forkId}`;
      this.provider = new ethers.providers.JsonRpcProvider(forkRPC);
      return this.provider;
    }
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

  async sendTransaction(
    { address, data, from }:
    { address: `0x${string}`; data: `0x${string}`; from: string }
  ): Promise<string> {
    const params = [{
      to: address,
      from,
      data,
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

  async simulate(input: string, to: string, from: string, gnosisMulticall = false): Promise<any> {
    const data = {
      network_id: '1',
      save: true,
      save_if_fails: true,
      from,
      to,
      input,
      gas: 30000000,
    } as any;
    // set some overrides for gnosis multicall
    if (gnosisMulticall) {
      data.state_objects = {
        [to]: {
          storage: {
            '0x0000000000000000000000000000000000000000000000000000000000000004':
              '0x0000000000000000000000000000000000000000000000000000000000000001',
          }
        }
      };
    }
    return axios({ method: 'POST', headers: this.headers, url: `${this.API}/simulate`, data }).then(async (res) => {
      // make simulation shared
      // https://api.tenderly.co/api/v1/account/:accountID/project/:projectSlug/simulations/:simulationID/share
      const simulationID = res.data.simulation.id;
      return axios({ method: 'POST', headers: this.headers, url: `${this.API}/simulations/${simulationID}/share` }).then(() => {
        return {
          success: res.data.transaction.status,
          url: `${DASHBOARD}/shared/simulation/${simulationID}`
        };
      }).catch((e) => {
        return Promise.reject(e.response.data);
      });
    });
  }
}
