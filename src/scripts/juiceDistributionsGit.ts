import { NanceExtensions } from '../extensions';
import { getConfig } from '../configLoader';
import { GithubFileChange } from '../types';

async function main() {
  const config  = await getConfig();
  const nanceExt = new NanceExtensions(config);

  const cycle = 28;

  const payoutCSV_V1 = await nanceExt.juiceboxHandlerV1.getPayoutDistributionCSV();
  const reserveCSV_V1 = await nanceExt.juiceboxHandlerV1.getReserveDistributionCSV();

  const payoutCSV_V2 = await nanceExt.juiceboxHandlerV2.getPayoutDistributionCSV();
  const reserveCSV_V2 = await nanceExt.juiceboxHandlerV2.getReserveDistributionCSV();

  nanceExt.githubProposalHandler.GithubAPI.createCommitOnBranch([
    {
      path: `GC${cycle}/config/V1/payout.csv`,
      contents: payoutCSV_V1
    },
    {
      path: `GC${cycle}/config/V1/reserve.csv`,
      contents: reserveCSV_V1
    },
    {
      path: `GC${cycle}/config/V2/payout.csv`,
      contents: payoutCSV_V2
    },
    {
      path: `GC${cycle}/config/V2/reserve.csv`,
      contents: reserveCSV_V2
    }
  ], 'push payout info');
}

main();