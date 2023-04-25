import { JuiceboxHandlerV3 } from '../juiceboxHandlerV3';
import { getJBSplit } from '../typesV3';
import { doltConfig } from '../../configLoader';
import { DoltHandler } from '../../dolt/doltHandler';
import { myProvider, uuid } from '../../utils';
import { dbOptions } from '../../dolt/dbConfig';

async function main() {
  const { config } = await doltConfig('waterbox');
  const dolt = new DoltHandler(dbOptions('waterbox'), config.propertyKeys);
  const juicebox = new JuiceboxHandlerV3('1', myProvider());
  const splitsOutput = await juicebox.getReserveDistribution();
  const splits = splitsOutput.map((split) => { return getJBSplit(split); });
  dolt.addReserveToDb(splits, uuid(), 12);
}

main();
