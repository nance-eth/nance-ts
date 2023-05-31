/* eslint-disable prefer-promise-reject-errors */
import { ethers } from 'ethers';
import axios from 'axios';
import { encodeMulti } from 'ethers-multisend';
import fs from 'fs';
import { BasicTransaction, PartialTransaction, FunctionFragmentInput, FunctionFragment } from '../types';
import { keys } from '../keys';
import { SQLCustomTransaction } from '../dolt/schema';

const supportedTokens = ['DAI', 'USDC', 'JBX', 'JBXv1', 'TicketBoothV1'];
const multiSendContractAddress = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D';
const savedABI: { address: string, abi: any }[] = [];
// eslint-disable-next-line max-len, quote-props, key-spacing, @typescript-eslint/quotes
const builderHeader = { "version":"1.0", "chainId":"1", "createdAt": "", "meta":{ "name":"nance batch", "description":"", "txBuilderVersion":"1.14.1", "createdFromSafeAddress":"0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e", "createdFromOwnerAddress":"", "checksum":"" } };

type Token = { address: string; abi: any };

function localABI(name: string) {
  return JSON.parse(fs.readFileSync(`${__dirname}/abi/${name}.json`, 'utf-8')) as unknown as Token;
}

export function adjustFunctionFragment(fragment: FunctionFragmentInput): FunctionFragment {
  const cleanedFragment = {
    gas: fragment.gas ?? undefined,
    name: fragment.name,
    type: fragment.type,
    stateMutability: fragment.stateMutability,
    inputs: fragment.inputs.map((input) => {
      return {
        name: input.name,
        type: input.type,
        internalType: input.baseType,
        indexed: input.indexed || false
      };
    }),
    outputs: fragment.outputs.map((output) => {
      return {
        name: output.name || undefined,
        type: output.type,
        internalType: output.baseType
      };
    }),
  };
  return cleanedFragment;
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

export const fetchABI = async (address: string) => {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${keys.ETHERSCAN_KEY}`;
  return axios.get(url).then((res) => {
    return JSON.parse(res.data.result);
  }).catch((e) => {
    return Promise.reject(e);
  });
};

export async function encodeCustomTransaction(txn: SQLCustomTransaction): Promise<BasicTransaction> {
  const functionFragment = txn.transactionFunctionFragment;
  const iface = new ethers.utils.Interface([ethers.utils.Fragment.fromObject(functionFragment)]);
  const inputs = functionFragment.inputs.map((input) => { return txn.transactionFunctionArgs[input.name]; });
  const encodedData = iface.encodeFunctionData(txn.transactionFunctionName, inputs);
  return {
    address: txn.transactionAddress,
    bytes: encodedData
  };
}

export async function encodeGnosisMulticall(txn: SQLCustomTransaction[], signer: string) {
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
}
