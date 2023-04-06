import { doltConfig } from '../../configLoader';
import { dbOptions } from '../dbConfig';
import { DoltHandler } from '../doltHandler';

async function main() {
  const { config } = await doltConfig('testytesty');
  const dolt = new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
  dolt.localDolt.addRemote(`https://doltremoteapi.dolthub.com/nance/${config.name}`).then((res) => {
    console.log(res);
  }).catch((e) => {
    console.log(e);
  });
}

main();
