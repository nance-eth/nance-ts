import { NotionHandler } from '../../notion/notionHandler';
import { NanceTreasury } from '../../treasury';
import { getConfig } from '../../configLoader';
import { ONE_BILLION } from '../juiceboxMath';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const treasury = new NanceTreasury(config, notion);
  const output = await treasury.payoutTableToGroupedSplitsStruct('V3');
  console.log(output.groupedSplits[0]);
  const outputSum = output.groupedSplits[0].splits.map((split) => {
    return split.percent;
  }).reduce((total, split) => {
    return Number(total) + Number(split);
  });
  console.log(`outputSum = ${outputSum}, ${outputSum === ONE_BILLION}`);
  console.log(`distributionLimit = ${output.newDistributionLimit}`);
  // process.stdout.write(JSON.stringify(await treasury.V2encodeReconfigureFundingCyclesOf('V2')));
}

main();
