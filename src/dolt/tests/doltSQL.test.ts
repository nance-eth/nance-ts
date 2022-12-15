import { DoltSQL } from '../doltSQL';

async function main() {
  const dolt = new DoltSQL({ database: 'juicebox' });
  console.log(await dolt.testConnection());
  console.log(await dolt.viewRemotes());
  console.log(await dolt.showBranches());
  console.log(await dolt.showActiveBranch());
  console.log(await dolt.query('SELECT * FROM payouts'));
  // console.log(await dolt.checkout('GC37') === 0);
  // dolt.createBranch('hello').then((res) => {
  //   console.log(res);
  // }).catch((e) => {});
  // await dolt.checkout('main').then((res) => {
  //   console.log(res);
  //   dolt.showActiveBranch().then((act) => {
  //     console.log(act);
  //   });
  // });
  // console.log(await dolt.deleteBranch('hello').catch((e) => { console.log(e); }));
  // console.log(await dolt.showActiveBranch());
  // console.log(await dolt.showActiveBranch());
}

main();
