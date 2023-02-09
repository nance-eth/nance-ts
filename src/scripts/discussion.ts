import { getConfig, cidConfig } from '../configLoader'
import { Nance } from '../nance';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  nance.setDiscussionInterval(30);
}

async function cidMain() {
  const config = await cidConfig('juicebox');
  console.log(config);
  // const nance = new Nance(config);
  // nance.setDiscussionInterval(30);
}

main();
