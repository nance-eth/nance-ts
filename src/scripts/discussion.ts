import { getConfig } from '../configLoader'
import { Nance } from '../nance';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  nance.setDiscussionInterval(30);
}

main();
