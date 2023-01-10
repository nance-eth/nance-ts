import { DoltHandler } from '../../dolt/doltHandler';
import { NanceTreasury } from '../../treasury';
import { getConfig } from '../../configLoader';
import { ONE_BILLION } from '../juiceboxMath';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler({ database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD }, config.propertyKeys);
  console.log(await dolt.localDolt.showActiveBranch());
  const treasury = new NanceTreasury(config, dolt);
  const output = await treasury.payoutTableToGroupedSplitsStruct('V3');
  console.log(output.groupedSplits[0]);
  // console.log(output.groupedSplits[1]);
  const outputSum = output.groupedSplits[0].splits.map((split) => {
    return split.percent;
  }).reduce((total, split) => {
    return Number(total) + Number(split);
  });
  // console.log(`outputSum = ${outputSum}, ${outputSum === ONE_BILLION}`);
  // console.log(`distributionLimit = ${output.newDistributionLimit}`);
  // process.stdout.write(JSON.stringify(await treasury.V2encodeReconfigureFundingCyclesOf('V3')));
  // const v1output = await treasury.payoutTableToMods();
  // console.log(v1output.payoutMods);
}

main();
