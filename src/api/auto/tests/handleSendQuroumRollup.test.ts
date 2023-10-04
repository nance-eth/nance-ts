import { sleep } from '../../../utils';
import { getSpaceInfo } from '../../helpers/getSpaceInfo';
import { sendQuorumRollup } from '../vote';

async function main() {
  await sleep(1000);
  const space = await getSpaceInfo('juicebox');
  sendQuorumRollup(space);
}

main();
