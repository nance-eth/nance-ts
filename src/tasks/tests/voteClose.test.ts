import { getSpaceConfig } from '../../api/helpers/getSpace';
import { sleep } from '../../utils';
import { voteClose } from '../voteClose';

const space = 'waterbox';

async function main() {
  await sleep(1000);
  const { config: configJuicebox } = await getSpaceConfig(space);
  const outcome = await voteClose(space, configJuicebox, undefined, true);
  outcome.map((proposal) => { return console.log(`${proposal.title}: ${proposal.status}`); });
}

main();
