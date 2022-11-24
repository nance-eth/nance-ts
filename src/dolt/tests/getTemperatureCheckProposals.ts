import { DoltHandler } from '../doltHandler';
import { getConfig } from '../../configLoader';
import { keys } from '../../keys';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler(
    config.dolt.owner,
    config.dolt.repo,
    keys.DOLT_KEY
  );
  console.log(await dolt.getTemperatureCheckProposals());
}

main();
