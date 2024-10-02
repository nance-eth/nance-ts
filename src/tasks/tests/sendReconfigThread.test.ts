import { initializePools } from '@/dolt/pools';
import { getSpaceConfig } from '../../api/helpers/getSpace';
import { sendReconfigThread } from "../sendReconfigThread";

async function main() {
  await initializePools();
  const { config: juiceboxConfig } = await getSpaceConfig('juicebox');
  const { config: waterboxConfig } = await getSpaceConfig('waterbox');
  await sendReconfigThread('juicebox', juiceboxConfig);
}

main();
