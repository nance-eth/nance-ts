import fs from 'fs';
import { JBSplitStruct } from 'juice-sdk/dist/cjs/types/contracts/JBSplitsStore';
import { BigNumber } from 'ethers';
import { JuiceboxHandlerV2 } from '../juiceboxHandlerV2';
import { JuiceboxHandlerV1 } from '../juiceboxHandlerV1';
import {
  getJBFundingCycleDataStruct,
  getJBFundingCycleMetadataStruct,
  ReconfigureFundingCyclesOfData,
  getJBFundAccessConstraintsStruct
} from '../typesV2';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
  const juice = new JuiceboxHandlerV2('13');
  console.log(await juice.getProjectOwner());
}

async function saveMetaData() {
  const juice = new JuiceboxHandlerV2('1');
  const { fundingCycle, metadata } = await juice.JBController.queuedFundingCycleOf('1');
  const defaultFundingCycleData = getJBFundingCycleDataStruct(fundingCycle, BigNumber.from(0), ZERO_ADDRESS);
  const defaultFundingCycleMetaData = getJBFundingCycleMetadataStruct(metadata);
  const dataOut = { ...defaultFundingCycleData, ...defaultFundingCycleMetaData };
  fs.writeFileSync('./src/juicebox/tests/JB_FundingCycle.json', JSON.stringify(dataOut, null, 4));
}

saveMetaData();
