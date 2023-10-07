import { getSpaceInfo } from '../api/helpers/getSpaceInfo';
import { Nance } from '../nance';
import { getLastSlash, sleep } from '../utils';

async function main() {
  const { config } = await getSpaceInfo(process.env.CONFIG || '');
  const nance = new Nance(config);
  const proposals = await nance.dProposalHandler.getToDiscuss();
  // eslint-disable-next-line no-await-in-loop
  while (!nance.dialogHandler.ready()) { await sleep(50); }
  proposals.map(async (proposal) => {
    const discussionThreadURL = await nance.dialogHandler.startDiscussion(proposal);
    nance.dialogHandler.setupPoll(getLastSlash(discussionThreadURL));
    nance.dProposalHandler.updateDiscussionURL({ ...proposal, discussionThreadURL });
  })
}

main();
