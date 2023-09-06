import axios from 'axios';
import { NANCE_AUTO_KEY } from '../../../keys';

const API_LOCAL = 'http://localhost:3003';
async function main() {
  axios.get(`${API_LOCAL}/auto/events`, {
    headers: {
      Authorization: `Bearer ${NANCE_AUTO_KEY}`
    }
  }).then((res) => {
    console.log(res.data);
  }).catch((e) => {
    console.log(e);
  });
}

main();
