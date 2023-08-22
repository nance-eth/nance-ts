/* eslint-disable prefer-promise-reject-errors */
import { ethers } from 'ethers';
import axios from 'axios';
import { encodeMulti } from 'ethers-multisend';
import fs from 'fs';
import { BasicTransaction, PartialTransaction } from '../types';
import { keys } from '../keys';
import { SQLCustomTransaction } from '../dolt/schema';

const supportedTokens = ['DAI', 'USDC', 'JBX', 'JBXv1', 'TicketBoothV1'];
const multiSendContractAddress = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D';
// eslint-disable-next-line max-len, quote-props, key-spacing, @typescript-eslint/quotes
const builderHeader = { "version":"1.0", "chainId":"1", "createdAt": "", "meta":{ "name":"nance batch", "description":"", "txBuilderVersion":"1.14.1", "createdFromSafeAddress":"0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e", "createdFromOwnerAddress":"", "checksum":"" } };

type Token = { address: string; abi: any };

function localABI(name: string) {
  return JSON.parse(fs.readFileSync(`${__dirname}/abi/${name}.json`, 'utf-8')) as unknown as Token;
}

export function encodeERC20Transfer(to: string, value: string, token: string): BasicTransaction {
  if (!supportedTokens.includes(token)) throw Error('Unsupported token');
  const loadedToken = localABI(token);
  const iface = new ethers.utils.Interface(loadedToken.abi);
  return {
    address: loadedToken.address,
    bytes: iface.encodeFunctionData('transfer(address, uint256)', [to, value])
  };
}

export function ticketBoothTransfer(holder: string, projectId: string, amount: string, receipient: string): BasicTransaction {
  const loadedToken = localABI('TicketBoothV1');
  const iface = new ethers.utils.Interface(loadedToken.abi);
  return {
    address: loadedToken.address,
    bytes: iface.encodeFunctionData('transfer(address, uint256, uint256, address)', [holder, Number(projectId), amount, receipient])
  };
}

export function encodeBatchTransactions(transactions: PartialTransaction[]) {
  return encodeMulti(transactions, multiSendContractAddress);
}

export function safeTransactionBuilderFormatting() {
  return builderHeader;
}

export const fetchABI = async (address: string) => {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${keys.ETHERSCAN_KEY}`;
  return axios.get(url).then((res) => {
    return JSON.parse(res.data.result);
  }).catch((e) => {
    return Promise.reject(e);
  });
};

export function encodeCustomTransaction(txn: SQLCustomTransaction) {
  try {
    const functionName = txn.transactionFunctionName;
    const iface = new ethers.utils.Interface([functionName]);
    // check for empty string or bytes and replace with 0x (required for ethersjs to encode properly)
    // eslint-disable-next-line no-param-reassign
    txn.transactionFunctionArgs = txn.transactionFunctionArgs.map((arg) => {
      if (arg === '') return '0x';
      return arg;
    });
    // eslint-disable-next-line no-param-reassign
    txn.transactionFunctionArgs = txn.transactionFunctionArgs.map((arg) => {
      try { return JSON.parse(arg); } catch (e) { return arg; }
    });
    const encodedData = iface.encodeFunctionData(functionName.split('function ')[1], txn.transactionFunctionArgs);
    return {
      address: txn.transactionAddress,
      bytes: encodedData
    };
  } catch (e) {
    console.log(e);
    return Promise.reject(e);
  }
}

export async function encodeGnosisMulticall(txn: SQLCustomTransaction[], signer: string) {
  try {
    const partials = (await Promise.all(txn.map((t) => { return encodeCustomTransaction(t); }))).map((t) => {
      return {
        to: t.address,
        value: '0',
        data: t.bytes
      };
    });
    const { abi } = localABI('SAFE');
    const iface = new ethers.utils.Interface(abi);
    const multicall = encodeBatchTransactions(partials);

    const encodedData = iface.encodeFunctionData('execTransaction', [
      multiSendContractAddress,
      '0',
      multicall.data,
      1,
      '0',
      '0',
      '0',
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      `0x000000000000000000000000${signer.split('0x')[1]}000000000000000000000000000000000000000000000000000000000000000001` // include signature
    ]);
    return { data: encodedData, count: partials.length, transactions: partials };
  } catch (e) {
    return Promise.reject(e);
  }
}
