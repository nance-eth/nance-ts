import { Nance } from '../nance';
import { sleep } from '../utils';
import { getSpaceInfo } from '../api/helpers/getSpaceInfo';

async function getConfigs() {
  const spaceInfo = await getSpaceInfo(process.env.CONFIG || '');
  const nance = new Nance(spaceInfo.config);
  await sleep(2000);
  nance.dProposalHandler.getVoteProposals(true).then((proposals) => {
    nance.dialogHandler.sendVoteRollup(proposals, new Date('2023-10-06T00:00:00.000Z'));
  });
}

getConfigs();
