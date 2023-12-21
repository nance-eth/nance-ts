import { getSpaceConfig } from '../../api/helpers/getSpace';
import { deleteStartOrEndAlert } from '../deleteStartOrEndAlert';
import { TASKS } from '../../constants';

const space = 'waterbox';

async function main() {
  const spaceConfig = await getSpaceConfig(space);
  await deleteStartOrEndAlert(space, spaceConfig.config, TASKS.temperatureCheckEndAlert);
}

main();
