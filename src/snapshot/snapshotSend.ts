import snapshot from '@snapshot-labs/snapshot.js';

const hub = 'https://seq.snapshot.org';
const client = new snapshot.Client712(hub);

async function main() {
  const d = await fetch("https://nance.infura-ipfs.io/ipfs/QmWPK2QwmGKZgiEDWRPXk4UrLnEUftZwTjAjqYQNujGuL3");
  const data = await d.json();
  console.log(data);
  fetch(hub, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  }).then(async (res) => {
    const r = await res.json();
    console.log(r);
  }).catch((e) => {
    console.error(e);
  });
}

main();
