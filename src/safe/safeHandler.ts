import { ethers, Wallet } from 'ethers';
import axios from 'axios';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';
import Safe from '@gnosis.pm/safe-core-sdk';
import { keys } from '../keys';
import logger from '../logging';

const headers = { 'Content-type': 'application/json' };

export const API = (network = 'mainnet') => { return `https://safe-transaction-${network}.safe.global`; };

export class SafeHandler {
  private TRANSACTION_API;
  private walletAddress;

  private constructor(
    protected safeAddress: string,
    protected safe: Safe,
    protected wallet: Wallet,
    protected network = 'mainnet' as 'mainnet' | 'rinkeby' | 'goerli'
  ) {
    this.safeAddress = ethers.utils.getAddress(safeAddress.toLowerCase());
    this.walletAddress = ethers.utils.getAddress(this.wallet.address.toLowerCase());
    this.TRANSACTION_API = API();
  }

  static async initializeSafe(safeAddress: string, network = 'mainnet' as 'mainnet' | 'rinkeby' | 'goerli') {
    const RPC_HOST = `https://${network}.infura.io/v3/${keys.INFURA_KEY}`;
    const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
    const wallet = new ethers.Wallet(keys.PRIVATE_KEY, provider);
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: wallet,
    });
    const safe = await Safe.create({ ethAdapter, safeAddress });
    return new SafeHandler(safeAddress, safe, wallet, network);
  }

  // eslint-disable-next-line class-methods-use-this
  private adjustV(signature: string) {
    const MIN_VALID_V_VALUE = 27;
    let sigV = parseInt(signature.slice(-2), 16);
    if (sigV < MIN_VALID_V_VALUE) {
      sigV += MIN_VALID_V_VALUE;
    }
    return signature.slice(0, -2) + sigV.toString(16);
  }

  private async signDelegateMessage(delegateAddress: string) {
    const totp = Math.floor(Date.now() / 1000 / 3600);
    const msg = `${delegateAddress}${totp}`;
    const initialSignature = await this.wallet.signMessage(msg);
    return this.adjustV(initialSignature);
  }

  async setDelegate(delegateAddress: string) {
    // https://github.com/Soptq/gnosis-safe-delegate-dapp/blob/8eeff181344678dbba1208f53da53f4ca6873ed1/src/App.js#L73
    const checksumDelegateAddress = ethers.utils.getAddress(delegateAddress.toLowerCase());
    const signature = await this.signDelegateMessage(checksumDelegateAddress);
    return axios({
      method: 'post',
      url: `${this.TRANSACTION_API}/api/v1/delegates/`,
      headers,
      data: {
        safe: this.safeAddress,
        delegate: checksumDelegateAddress,
        delegator: this.walletAddress,
        signature,
        label: 'nance'
      }
    }).then((response) => {
      return response.data;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async getDelegates() {
    return axios({
      method: 'get',
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeAddress}/delegates`,
      headers,
    }).then((response) => {
      return response.data;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  static async getSigners(safeAddress: string, network = 'mainnet'): Promise<string[]> {
    return axios({
      method: 'get',
      url: `${API(network)}/api/v1/safes/${safeAddress}`,
      headers,
    }).then((res) => {
      return res.data.owners;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async getSafe() {
    return axios({
      method: 'get',
      url: `${this.TRANSACTION_API}/api/v1/owners/${this.walletAddress}/safes`,
      headers,
    }).then((response) => {
      return response.data;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async getCurrentNonce(queued = true) {
    return axios({
      method: 'get',
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeAddress}/all-transactions`,
      headers,
      params: {
        limit: 10,
        executed: false,
        queued,
        trusted: true,
      },
    }).then((response) => {
      return (response.data.results.length > 0) ? response.data.results[0].nonce : 0;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  static async getCurrentNonce(safeAddress: string, network: string, queued = true): Promise<number> {
    return axios({
      method: 'get',
      url: `${API()}/api/v1/safes/${safeAddress}/all-transactions`,
      headers,
      params: {
        limit: 10,
        executed: false,
        queued,
        trusted: true,
      },
    }).then((response) => {
      const { nonce } = response.data.results.find((txn: any) => { return txn.nonce; });
      return Number(nonce);
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async getGasEstimate(subTransaction: SafeTransactionDataPartial): Promise<any> {
    return axios({
      method: 'post',
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeAddress}/multisig-transactions/estimations/`,
      headers,
      data: {
        ...subTransaction
      }
    }).then((response) => {
      return response.data;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async sendTransaction(transactionInitial: SafeTransactionDataPartial, executeIt = false) {
    const transaction = await this.safe.createTransaction(transactionInitial);
    const transactionHash = await this.safe.getTransactionHash(transaction);
    const transactionSignature = await this.safe.signTransactionHash(transactionHash);
    // const transactionResponse = await this.safe.executeTransaction(transaction).then((response) => {
    //   return response.transactionResponse;
    // }).catch((e) => {
    //   logger.error(e);
    //   return Promise.reject(e);
    // });
    // return transactionResponse;
    // If we cant executeTransaction as a delegate do back to doing it way below
    const data = {
      ...transactionInitial,
      sender: this.walletAddress,
      contractTransactionHash: transactionHash,
      signature: transactionSignature.data
    };
    return axios({
      method: 'post',
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeAddress}/multisig-transactions/`,
      headers,
      data
    }).then((response) => {
      return response.status;
    }).catch((e) => {
      logger.info(e.response.data);
      return Promise.reject(e);
    });
  }
}
