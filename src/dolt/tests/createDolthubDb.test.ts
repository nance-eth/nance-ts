import { createDolthubDB } from '../doltAPI';

async function main() {
  createDolthubDB('testingthething').then((res) => {
    console.log(res);
  }).catch((e) => { console.log(e); });
}

main();
