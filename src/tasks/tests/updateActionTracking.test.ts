import { sleep } from '../../utils';
import { updateActionTracking } from '../updateActionTracking';

async function main() {
  await sleep(2000);
  await updateActionTracking("waterbox", 74);
}

main();
