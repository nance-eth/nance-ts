import { sleep } from '../../utils';
import { updateActionTracking } from '../updateActionTracking';

async function main() {
  await sleep(2000);
  await updateActionTracking("juicebox", 82);
}

main();
