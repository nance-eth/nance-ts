/* eslint-disable no-await-in-loop */
import axios from 'axios';
import { getConfig } from '../../configLoader';
import { Nance } from '../../nance';
import { getLastSlash, sleep } from '../../utils';
import { pin } from '../storageHandler';

// async function main() {
//   const config = await getConfig();
//   const nance = new Nance(config);
//   for (let i = 39; i < 48; i += 1) {
//     const proposals = await nance.proposalHandler.getProposalsByGovernanceCycle(i.toString());
//     console.log(proposals);
//     proposals.forEach(async (proposal) => {
//       const ipfsURL = (getLastSlash(proposal.ipfsURL).length > 46) ? proposal.ipfsURL.split('.')[0].replace('https://', '') : getLastSlash(proposal.ipfsURL);
//       if (proposal.ipfsURL?.length > 0) {
//         console.log(proposal.ipfsURL);
//         nance.dProposalHandler.localDolt.db.query(`UPDATE proposals SET ipfsCID = '${ipfsURL}' WHERE uuid = '${proposal.hash}'`);
//         await sleep(5000);
//       }
//     });
//     await sleep(5000);
//   }
// }

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const CIDs = await nance.dProposalHandler.localDolt.db.query(
    'SELECT ipfsCID FROM proposals WHERE ipfsCID IS NOT NULL').then((res) => {
    return res[0] as any[];
  });
  console.log(CIDs);
  for (let i = 2; i < CIDs.length; i += 1) {
    const cid = CIDs[i].ipfsCID;
    console.log(cid);
    console.log('get from cf');
    try {
      const axiosOk = await axios.get(`https://cloudflare-ipfs.com/ipfs/${cid}`).then((res) => {
        return res.status === 200;
      });
      if (axiosOk) {
        await pin(cid).then(async (res) => {
          console.log(res);
        }).catch((err) => {
          console.log('pin error');
          console.log(err.data);
        });
      } else {
        console.log('axios not ok');
      }
    } catch (e: any) {
      console.log('axios error');
      console.log(e.data);
    }
    console.log('sleep 10s');
    await sleep(10000);
  }
}

main();
