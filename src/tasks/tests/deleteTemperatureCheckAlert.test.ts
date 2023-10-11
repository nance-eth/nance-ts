import { getSpaceConfig } from '../../api/helpers/getSpace';
import { deleteStartOrEndAlert } from '../deleteStartOrEndAlert';
import { TASKS } from '../../constants';

async function main() {
  const spaceConfig = await getSpaceConfig('waterbox');
  await deleteStartOrEndAlert(spaceConfig.config, TASKS.temperatureCheckEndAlert);
}

main();
