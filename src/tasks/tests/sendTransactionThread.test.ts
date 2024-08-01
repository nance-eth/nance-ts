import { getSpaceConfig } from '../../api/helpers/getSpace';
import { sendTransactionThread } from "../sendTransactionsThread";

async function main() {
  const { config: jucieboxConfig } = await getSpaceConfig('juicebox');
  const { config: waterboxConfig } = await getSpaceConfig('waterbox');
  await sendTransactionThread('juicebox', jucieboxConfig, waterboxConfig);
}

main();
