import { getConfig } from '../../configLoader';
import { GnosisHandler } from '../gnosisHandler';

async function main() {
  const config = await getConfig();
  console.log(await GnosisHandler.getSigners(config.juicebox.gnosisSafeAddress));
}

main();
