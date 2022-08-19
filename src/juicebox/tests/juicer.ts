import fs from 'fs';
import { JuiceboxHandlerV2 } from '../juiceboxHandlerV2';
import { JuiceboxHandlerV1 } from '../juiceboxHandlerV1';

async function V2() {
  const juice = new JuiceboxHandlerV2('1');
  const distributions = await juice.getReserveDistributionCSV();
  console.log(distributions);
}

async function V1() {
  const juice = new JuiceboxHandlerV1('1');
  console.log((await juice.getReserveDistributionCSV()));
  console.log(Number((await juice.getDistributionLimit()).toString()) / 1E18);
}

V1();
