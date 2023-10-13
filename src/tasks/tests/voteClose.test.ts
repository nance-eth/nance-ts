import { getSpaceConfig } from '../../api/helpers/getSpace';
import { sleep } from '../../utils';
import { getProposalsWithVotes } from '../helpers/voting';
import { voteClose } from '../voteClose';

async function main() {
  await sleep(1000);
  const { config: configJuicebox } = await getSpaceConfig('juicebox');
  const outcome = await voteClose(configJuicebox, undefined, true);
  outcome.map((proposal) => { return console.log(`${proposal.title}: ${proposal.status}`); });
}

main();
