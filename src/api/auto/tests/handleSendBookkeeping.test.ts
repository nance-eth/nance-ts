import { sleep } from '../../../utils';
import { getSpaceInfo } from '../../helpers/getSpaceInfo';
import { EVENTS } from '../../../constants';
import { sendBookkeeping } from '../execute';

async function main() {
  await sleep(1000);
  const space = await getSpaceInfo('juicebox');
  space.currentEvent.title = EVENTS.EXECUTION;
  sendBookkeeping(space);
}

main();
