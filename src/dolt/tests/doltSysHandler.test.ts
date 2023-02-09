import { DoltSysHandler } from '../doltSysHandler';

async function main(space: string) {
  const dolt = new DoltSysHandler();
  console.log(await dolt.getSpaceCID(space));
}

main('juicebox');
