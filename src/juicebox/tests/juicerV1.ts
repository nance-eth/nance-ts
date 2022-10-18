import fs from 'fs';
import { BigNumber } from 'ethers';
import { JuiceboxHandlerV1 } from '../juiceboxHandlerV1';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function V1() {
  const juice = new JuiceboxHandlerV1('1');
  console.log(await juice.getProjectOwner());
  // console.log((await juice.getReserveDistributionCSV()));
  // console.log(await juice.getPayoutDistribution());
  // console.log(Number((await juice.getDistributionLimit()).toString()) / 1E18);
}

V1();
