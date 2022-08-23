import fs from 'fs';
import { JBSplitStruct } from 'juice-sdk/dist/cjs/types/contracts/JBSplitsStore';
import { BigNumber } from 'ethers';
import { JuiceboxHandlerV2 } from '../juiceboxHandlerV2';
import { JuiceboxHandlerV1 } from '../juiceboxHandlerV1';

async function V2() {
  const juice = new JuiceboxHandlerV2('1');
  const reserved = (await juice.getReserveDistribution()).map((distribution) => {
    return [...distribution];
  });
  const payouts = (await juice.getPayoutDistribution()).map((distribution) => {
    return [...distribution];
  });
  const grouped = [[1, payouts], [2, reserved]];
  console.log(grouped);
  console.log(await juice.getSetDistributionHexEncoded(grouped, '4553'));
}

async function getMetaData() {
  const juice = new JuiceboxHandlerV2('1');
  console.log((await juice.getNewWeight()));
}

async function V1() {
  const juice = new JuiceboxHandlerV1('1');
  console.log((await juice.getReserveDistributionCSV()));
  console.log(Number((await juice.getDistributionLimit()).toString()) / 1E18);
}

getMetaData();
