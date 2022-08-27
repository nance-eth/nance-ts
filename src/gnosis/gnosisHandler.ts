import { ethers } from 'ethers';
import axios from 'axios';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types';
import Safe, { SafeFactory } from '@gnosis.pm/safe-core-sdk';
import { keys } from '../keys';

const checksumNanceAddress = ethers.utils.getAddress('0x50e70c43a5dd812e2309eacea61348041011b4ba'.toLowerCase());
const headers = { 'Content-type': 'application/json' };

export class GnosisHandler {
  private wallet;
  private provider;
  private TRANSACTION_API;
  private RELAY_API;
  private walletAddressCheckSum;
  private safeInstance;

  constructor(
    protected safeAddress: string,
    protected network = 'mainnet' as 'mainnet' | 'rinkeby'
  ) {
    const RPC_HOST = `https://${this.network}.infura.io/v3/${keys.INFURA_KEY}`;
    this.provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
    this.wallet = new ethers.Wallet(keys.PRIVATE_KEY, this.provider);
    this.safeAddress = ethers.utils.getAddress(safeAddress.toLowerCase());
    this.walletAddressCheckSum = ethers.utils.getAddress(this.wallet.address.toLowerCase());
    this.TRANSACTION_API = (network === 'mainnet')
      ? 'https://safe-transaction.gnosis.io'
      : `https://safe-transaction.${network}.gnosis.io`;
    this.RELAY_API = (network === 'mainnet')
      ? 'https://safe-relay.gnosis.io'
      : `https://safe-relay.${network}.gnosis.io`;
    const ethAdapter = new EthersAdapter({
      ethers,
      signer: this.wallet
    });
    this.safeInstance = Safe.create({ ethAdapter, safeAddress: this.safeAddress });
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
        delegator: this.walletAddressCheckSum,
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

  async getSafe() {
    return axios({
      method: 'get',
      url: `${this.TRANSACTION_API}/api/v1/owners/${this.walletAddressCheckSum}/safes`,
      headers,
    }).then((response) => {
      return response.data;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async getCurrentNonce() {
    return axios({
      method: 'get',
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeAddress}`,
      headers
    }).then((response) => {
      return response.data.nonce;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async getGasEstimate(subTransaction: SafeTransactionDataPartial): Promise<any> {
    return axios({
      method: 'post',
      url: `${this.RELAY_API}/api/v2/safes/${this.safeAddress}/transactions/estimate/`,
      headers,
      data: {
        ...subTransaction
      }
    }).then((response) => {
      return response.data;
    }).catch((e) => {
      console.log(e);
      // return Promise.reject(e);
    });
  }

  async sendTransaction(transactionInitial: SafeTransactionDataPartial) {
    const transaction = (await this.safeInstance).createTransaction(transactionInitial);
    const transactionHash = (await this.safeInstance).getTransactionHash(await transaction);
    const transactionSignature = (await this.safeInstance).signTransactionHash(await transactionHash);
    const data = {
      ...transactionInitial,
      sender: checksumNanceAddress,
      contractTransactionHash: await transactionHash,
      signature: (await transactionSignature).data
    };
    console.dir(data, { depth: null });
    return axios({
      method: 'post',
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeAddress}/multisig-transactions/`,
      headers,
      data
    }).catch((e) => {
      console.log(e.response.data);
    });
  }
}
