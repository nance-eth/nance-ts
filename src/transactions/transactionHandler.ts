/* eslint-disable prefer-promise-reject-errors */
import { ethers } from 'ethers';
import { encodeMulti } from 'ethers-multisend';
import fs from 'fs';
import { BasicTransaction, PartialTransaction } from '../types';

const supportedTokens = ['DAI', 'USDC', 'JBX', 'JBXv1', 'TicketBoothV1'];
const multiSendContractAddress = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D';

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

export function ticketBoothTransfer(holder: string, projectId: string, amount: string, receipient: string) {
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
