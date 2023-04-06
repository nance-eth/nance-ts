import { DoltSysHandler } from '../dolt/doltSysHandler';

async function main() {
  const dolt = new DoltSysHandler();
  const res = await dolt.getSpaceConfig('nance');
  console.log(res);
}

main();
