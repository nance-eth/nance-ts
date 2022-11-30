import { DoltSQL } from '../doltSQL';

async function main() {
  const dolt = new DoltSQL({ database: 'juicebox_governance' });
  console.log(await dolt.testConnection());
  console.log(await dolt.viewRemotes());
  console.log(await dolt.showBranches());
  dolt.createBranch('hello').then((res) => {
    console.log(res);
  }).catch((e) => {});
  await dolt.checkout('main').then((res) => {
    console.log(res);
    // dolt.showActiveBranch().then((act) => {
    //   console.log(act);
    // });
  });
  // console.log(await dolt.deleteBranch('hello').catch((e) => { console.log(e); }));
  console.log(await dolt.showActiveBranch());
  console.log(await dolt.showActiveBranch());
}

main();
