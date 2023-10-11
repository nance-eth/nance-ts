import { getProposalsWithVotes } from '../helpers/voting';
import { voteQuorumAlert } from '../voteQuorumAlert';
import { getSpaceConfig } from '../../api/helpers/getSpace';
import { sleep } from '../../utils';
import { STATUS } from '../../constants';

async function main() {
  await sleep(1000);
  const { config: configWaterbox } = await getSpaceConfig('waterbox');
  const { config: configJuicebox } = await getSpaceConfig('juicebox');
  const proposals = await getProposalsWithVotes(configJuicebox);
  proposals[1].status = STATUS.APPROVED;
  proposals[1].voteResults = {
    choices: ['For', 'Against', 'Abstain'],
    scores: [1000000000, 1],
    scores_total: 1000000001,
    votes: 2,
    quoromMet: true,
  };
  await voteQuorumAlert(configWaterbox, new Date(), proposals);
}

main();
