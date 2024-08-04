import { getSpaceConfig } from '../../api/helpers/getSpace';
import { sendTransactionThread } from "../sendTransactionsThread";

async function main() {
  const { config: juiceboxConfig } = await getSpaceConfig('juicebox');
  const { config: waterboxConfig } = await getSpaceConfig('waterbox');
  await sendTransactionThread('juicebox', juiceboxConfig);
}

main();
