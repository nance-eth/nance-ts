import { getSpaceConfig } from "../../api/helpers/getSpace";
import { SafeHandler } from '../safeHandler';

async function main() {
  const { config } = await getSpaceConfig('juicebox');
  console.log(await SafeHandler.getSigners(config.juicebox.gnosisSafeAddress));
}

main();
