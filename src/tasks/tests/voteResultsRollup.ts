import { getSpaceConfig } from '../../api/helpers/getSpace';
import { STATUS } from '../../constants';
import { voteResultsRollup } from '../voteResultsRollup';
import { getProposalsWithVotes } from '../helpers/voting';

async function main() {
  const { config: configWaterbox } = await getSpaceConfig('waterbox');
  const { config: configJuicebox } = await getSpaceConfig('juicebox');
  // const currentEvent = getCurrentEvent(getNextEvents, spaceConfig.cycleStageLengths);
  const proposals = await getProposalsWithVotes(configJuicebox);
  await voteResultsRollup('waterbox', configWaterbox, proposals);
}

main();
