import { DoltHandler } from '../doltHandler';
import { getConfig } from '../../configLoader';
import { keys } from '../../keys';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler(
    config.dolt.owner,
    config.dolt.repo,
    keys.DOLT_KEY,
    config.propertyKeys
  );
  dolt.getTemperatureCheckProposals(36).then((res) => {
    console.log(res);
  }).catch((e) => {
    console.error(e);
  });
  console.log(await dolt.getNextProposalId(36));
}

main();
