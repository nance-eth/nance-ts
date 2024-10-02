import { initializePools } from '@/dolt/pools';
import { sleep } from '../../utils';
import { updateActionTracking } from '../updateActionTracking';

async function main() {
  await sleep(2000);
  await initializePools();
  await updateActionTracking("juicebox", 84);
}

main();
