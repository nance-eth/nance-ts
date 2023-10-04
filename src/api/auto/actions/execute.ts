import { DoltHandler } from '../../../dolt/doltHandler';
import { pools } from '../../../dolt/pools';
import { SpaceInfo } from '../../models';

export const sendBookkeeping = async (space: SpaceInfo) => {
  const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
  const numberOfStalePayouts = await dolt.setStalePayouts(space.currentCycle);
  console.log(numberOfStalePayouts);
};
