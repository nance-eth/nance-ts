import { JuiceboxHandlerV2 } from '../juiceboxHandlerV2';
import { JuiceboxHandlerV1 } from '../juiceboxHandlerV1';

async function V2() {
  const juice = new JuiceboxHandlerV2('1');
  console.log((await juice.getDistribution()));
  console.log(Number((await juice.getDistributionLimit())[0].toString()) / 1E18);
}

async function V1() {
  const juice = new JuiceboxHandlerV1('1');
  console.log((await juice.getDistribution()));
  console.log(Number((await juice.getDistributionLimit()).toString()) / 1E18);
}

V2();
