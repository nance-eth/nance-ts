import { DoltSysHandler } from '../doltSysHandler';

async function main(space: string) {
  const dolt = new DoltSysHandler();
  console.log(await dolt.getSpaceCID(space));
}

async function createSpace(space: string) {
  const dolt = new DoltSysHandler();
  dolt.createSpaceDB(space).then((res) => {
    console.log(res);
  }).catch((e) => {
    console.log(e.sqlMessage);
  });
}

async function createSchema(space: string) {
  const dolt = new DoltSysHandler();
  // dolt.createSchema(space).then((res) => {
  //   console.log(res);
  // }).catch((e) => {
  //   console.log(e.sqlMessage);
  // });
  console.log(await dolt.showDatabases());
}

createSchema('doodada');
