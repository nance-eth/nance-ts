import axios from 'axios';
import { PayoutsQueryResponse } from '../models';
import { signPayload, nanceWallet } from './signer';

const API_MAIN = 'https://api.nance.app';
const API_LOCAL = 'http://localhost:3000';

async function main() {
  const query: PayoutsQueryResponse = await axios.get(`${API_LOCAL}/waterbox/payouts`).then((res) => {
    return res.data;
  });
  query.data[0].payName = 'hihihi';
  const payouts = query.data;
  const signature = await signPayload('waterbox', 'payouts', { payouts }, nanceWallet);

  const edits = await axios.put(`${API_LOCAL}/waterbox/payouts`, { signature, payouts }).then((res) => {
    return res.data;
  });
  console.log(edits);
}

main();
