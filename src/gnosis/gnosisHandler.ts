import { ethers } from 'ethers';
import axios from 'axios';
import { SafeFactory } from '@gnosis.pm/safe-core-sdk';
import fs from 'fs';
import { keys } from '../keys';
import { SubTransaction, SafeMultisigTransaction, SafeEstimateResponse } from './gnosisTypes';
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const gnosisSafeABI = require('./GnosisSafeABI.json');

const gnosisSafeAddress = ethers.utils.getAddress('0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'.toLowerCase());
const checksumNanceAddress = ethers.utils.getAddress('0x50e70c43a5dd812e2309eacea61348041011b4ba'.toLowerCase());
const headers = { 'Content-type': 'application/json' };

export class GnosisHandler {
  private wallet;
  private provider;
  private TRANSACTION_API;
  private RELAY_API;
  private walletAddressCheckSum;

  constructor(
    protected safeId: string,
    protected network = 'mainnet' as 'mainnet' | 'rinkeby'
  ) {
    const RPC_HOST = `https://${this.network}.infura.io/v3/${keys.INFURA_KEY}`;
    this.provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
    this.wallet = new ethers.Wallet(keys.PRIVATE_KEY, this.provider);
    this.safeId = ethers.utils.getAddress(safeId.toLowerCase());
    this.walletAddressCheckSum = ethers.utils.getAddress(this.wallet.address.toLowerCase());
    this.TRANSACTION_API = (network === 'mainnet')
      ? 'https://safe-transaction.gnosis.io'
      : `https://safe-transaction.${network}.gnosis.io`;
    this.RELAY_API = (network === 'mainnet')
      ? 'https://safe-relay.gnosis.io'
      : `https://safe-relay.${network}.gnosis.io`;
  }

  // eslint-disable-next-line class-methods-use-this
  getContractTransactionHash = async (transaction: SafeMultisigTransaction) => {
    const safeContract = new ethers.Contract(gnosisSafeAddress, gnosisSafeABI, this.wallet);
    const transactionHash = await safeContract.getTransactionHash(
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation,
      transaction.safeTxGas,
      transaction.baseGas,
      transaction.gasPrice,
      transaction.gasToken,
      transaction.refundReceiver,
      transaction.nonce
    );
    return transactionHash;
  };

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
        safe: this.safeId,
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
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeId}/delegates`,
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
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeId}`,
      headers
    }).then((response) => {
      return response.data.nonce;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async getGasEstimate(subTransaction: SubTransaction): Promise<SafeEstimateResponse> {
    // eslint-disable-next-line no-param-reassign
    subTransaction.to = ethers.utils.getAddress(subTransaction.to.toLowerCase());
    return axios({
      method: 'post',
      url: `${this.RELAY_API}/api/v2/safes/${this.safeId}/transactions/estimate/`,
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

  async sendTransaction(transactionInitial: SafeMultisigTransaction) {
    const transactionHash = await this.getContractTransactionHash(transactionInitial);
    const transactionUnsigned = {
      ...transactionInitial,
      contractTransactionHash: transactionHash,
      sender: checksumNanceAddress,
      origin: 'nance',
    };
    const lazyContractHash = await axios({
      method: 'post',
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeId}/multisig-transactions/`,
      headers,
      data: {
        ...transactionUnsigned
      }
    }).then((response) => {
      return response.data;
    }).catch((e) => {
      console.log(e.response.data);
      return (e.response.data.nonFieldErrors[0].split('Contract-transaction-hash=')[1].split(' ')[0]);
      // return Promise.reject(e);
    });
    // console.log(lazyContractHash);
    const signature = await this.wallet.signTransaction(lazyContractHash);
    const transaction = {
      ...transactionUnsigned,
      contractTransactionHash: lazyContractHash,
      signature
    };
    return axios({
      method: 'post',
      url: `${this.TRANSACTION_API}/api/v1/safes/${this.safeId}/multisig-transactions/`,
      headers,
      data: {
        ...transaction
      }
    }).then((response) => {
      return response.data;
    }).catch((e) => {
      console.log(e.response.data);
      // return Promise.reject(e);
    });
  }
}
