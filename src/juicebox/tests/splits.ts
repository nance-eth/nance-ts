import { DoltHandler } from '../../dolt/doltHandler';
import { NanceTreasury } from '../../treasury';
import { ONE_BILLION } from '../juiceboxMath';
import { myProvider } from '../../utils';
import { getSpaceInfo } from '../../api/helpers/getSpace';
import { pools } from '../../dolt/pools';

async function main() {
  const { config, currentCycle } = await getSpaceInfo(process.env.CONFIG || '');
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  console.log(await dolt.localDolt.showActiveBranch());
  const treasury = new NanceTreasury(config, dolt, myProvider('mainnet'), currentCycle);
  const output = await treasury.payoutTableToGroupedSplitsStruct();
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
