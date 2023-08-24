import { SpaceAuto } from '../../models';
import { discordLogin } from '../discord';
import { shouldIncrementDay } from './logic';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import { pools } from '../../../dolt/pools';
import { dateAtTime, downloadImages } from '../../../utils';
// import { juiceboxTime } from '../juicebox';

const doltSys = new DoltSysHandler(pools.nance_sys);

export const handleDaily = async (space: SpaceAuto) => {
  if (shouldIncrementDay(space)) {
    await doltSys.incrementCycleDay(space.name);
    // reread space config to see if cycleCurrentDay needs to roll over and if governanceCycle was updated
    const recheck = await doltSys.getSpaceConfig(space.name);
    if (recheck) {
      await downloadImages(space.name, space.config.discord.reminder.imagesCID, space.config.discord.reminder.imageNames);
      const { cycleCurrentDay, currentGovernanceCycle } = recheck;
      const dialogHandler = await discordLogin(space.config);
      const currentEvent = space.currentEvent.title.toLowerCase();
      // const { currentDay, currentCycle, remainingDHM, endTimestamp } = await juiceboxTime(space.config?.juicebox?.projectId);
      await dialogHandler.sendImageReminder(cycleCurrentDay.toString(), currentGovernanceCycle.toString(), currentEvent).then(async () => {
        await doltSys.updateCycleDayLastUpdated(
          space.name,
          dateAtTime(new Date(), space.cycleTriggerTime) // set to trigger time for next run
        );
      });
    }
  }
};
