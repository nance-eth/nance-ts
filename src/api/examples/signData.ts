import axios from 'axios';
import { ethers } from 'ethers';
import { SignedData } from '../../types';

const API_STAGING = 'https://nance-ts-staging.up.railway.app';
const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';
const API = API_LOCAL;

async function signatureCheck() {
  const wallet = ethers.Wallet.createRandom();
  const message = 'I signed this thing';
  const signature = await wallet.signMessage(message);
  const fuzzyTimeStamp = Math.floor(Date.now() / 1000 / 120);
  console.log(`address: ${wallet.address}`);
  console.log(`message: ${message}`);
  console.log(`signature: ${signature}`);
  const signedData: SignedData = {
    type: '',
    address: wallet.address,
    message,
    signature,
    fuzzyTimeStamp
  };
  axios.post(`${API}/signature`, {
    signedData
  }).then((response) => {
    console.log(response.data);
  });
}

signatureCheck();
