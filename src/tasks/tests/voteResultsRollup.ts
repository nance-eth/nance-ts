import { getSpaceConfig } from '../../api/helpers/getSpace';
import { STATUS } from '../../constants';
import { voteResultsRollup } from '../voteResultsRollup';
import { getProposalsWithVotes } from '../helpers/voting';

async function main() {
  const { config: configWaterbox } = await getSpaceConfig('waterbox');
  const { config: configJuicebox } = await getSpaceConfig('juicebox');
  // const currentEvent = getCurrentEvent(getNextEvents, spaceConfig.cycleStageLengths);
  const proposals = await getProposalsWithVotes(configJuicebox);
  proposals[1].status = STATUS.APPROVED;
  proposals[1].voteResults = {
    choices: ['For', 'Against', 'Abstain'],
    scores: [1000000000, 1],
    scores_total: 1000000001,
    votes: 2,
    quoromMet: true,
  };
  await voteResultsRollup(configWaterbox, proposals);
}

main();
