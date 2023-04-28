// Usage: ts-node fetchABI.ts <address> <tokenName>

import axios from 'axios';
import fs from 'fs';
import { keys } from '../../keys';

export const fetchABI = async (address: string) => {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${keys.ETHERSCAN_KEY}`;
  const response = await axios.get(url);
  return JSON.parse(response.data.result);
}

export const fetchABIAndWriteToFile = async (address: string, tokenName: string) => {
  const output = JSON.stringify({
    address,
    abi: await fetchABI(address),
  }, null, "  ");
  fs.writeFileSync(`${__dirname}/../tokens/${tokenName}.json`, output);
}

fetchABIAndWriteToFile(process.argv[2], process.argv[3]);