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
const savedABI: { address: string, abi: any }[] = [];

type Token = { address: string; abi: any };

export function encodeERC20Transfer(to: string, value: string, token: string): BasicTransaction {
  if (!supportedTokens.includes(token)) throw Error('Unsupported token');
  const loadedToken = JSON.parse(fs.readFileSync(`${__dirname}/tokens/${token}.json`, 'utf-8')) as unknown as Token;
  const iface = new ethers.utils.Interface(loadedToken.abi);
  return {
    address: loadedToken.address,
    bytes: iface.encodeFunctionData('transfer(address, uint256)', [to, value])
  };
}

export function ticketBoothTransfer(holder: string, projectId: string, amount: string, receipient: string): BasicTransaction {
  const loadedToken = JSON.parse(fs.readFileSync(`${__dirname}/tokens/TicketBoothV1.json`, 'utf-8')) as unknown as Token;
  const iface = new ethers.utils.Interface(loadedToken.abi);
  return {
    address: loadedToken.address,
    bytes: iface.encodeFunctionData('transfer(address, uint256, uint256, address)', [holder, Number(projectId), amount, receipient])
  };
}

export function encodeBatchTransactions(transactions: PartialTransaction[]) {
  return encodeMulti(transactions, multiSendContractAddress);
}

export const fetchABI = async (address: string) => {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${keys.ETHERSCAN_KEY}`;
  return axios.get(url).then((res) => {
    return JSON.parse(res.data.result);
  }).catch((e) => {
    return Promise.reject(e);
  });
};

export async function encodeCustomTransaction(txn: SQLCustomTransaction): Promise<BasicTransaction> {
  const abi = savedABI.filter((b) => { return b.address; })[0]?.abi ?? await fetchABI(txn.transactionAddress);
  savedABI.push(abi);
  const iface = new ethers.utils.Interface(abi);

  const functionFragment = iface.getFunction(txn.transactionFunctionName);
  const inputs = functionFragment.inputs.map((input) => { return txn.transactionFunctionArgs[input.name]; });

  const encodedData = iface.encodeFunctionData(txn.transactionFunctionName, inputs);
  return {
    address: txn.transactionAddress,
    bytes: encodedData
  };
}
