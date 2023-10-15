import { getSpaceConfig } from '../../api/helpers/getSpace';
import { sleep } from '../../utils';
import { sendBookkeeping } from '../sendBookkeeping';

async function main() {
  const { config: jucieboxConfig } = await getSpaceConfig('juicebox');
  const { config: waterboxConfig } = await getSpaceConfig('waterbox');
  await sleep(2000);
  await sendBookkeeping(jucieboxConfig, waterboxConfig);
}

main();
