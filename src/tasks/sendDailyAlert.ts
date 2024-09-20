import { Proposal } from "@nance/nance-sdk";
import { getSpaceConfig } from '../api/helpers/getSpace';
import { getCurrentEvent, getCurrentGovernanceCycleDay } from '../calendar/events';
import { discordLogin } from '../api/helpers/discord';
import logger from '../logging';
import { DoltHandler } from "../dolt/doltHandler";
import { getDb } from "../dolt/pools";

// node-schedule uses local time by default
process.env.TZ = 'UTC';

export async function sendDailyAlert(space: string) {
  logger.info('===================================================================');
  logger.info(`================= sending dailyAlert for ${space} =================`);
  const now = new Date();
  try {
    // refetch spaceConfig to get latest cycle information
    const spaceConfig = await getSpaceConfig(space);
    if (!spaceConfig || !spaceConfig.cycleStartReference || !spaceConfig.cycleStageLengths) return false;
    const { config, currentGovernanceCycle } = spaceConfig;
    const dolt = getDb(space);

    const governanceCycle = `${currentGovernanceCycle}+${currentGovernanceCycle + 1}`;
    const proposalsPacket = await dolt.getProposals({ governanceCycle });
    // perform some filtering and sorting
    const proposals = proposalsPacket.proposals.reduce((acc, proposal) => {
      if (
        (proposal.status === "Discussion" ||
        proposal.status === "Temperature Check" ||
        proposal.status === "Voting" ||
        proposal.status === "Approved" ||
        proposal.status === "Cancelled") &&
        proposal.proposalId
      ) acc.push(proposal);
      return acc;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    }, [] as Proposal[]).sort((a, b) => a.proposalId! - b.proposalId!);

    const currentEvent = getCurrentEvent(spaceConfig.cycleStartReference, spaceConfig.cycleStageLengths, now);
    const currentGovernanceCycleDay = getCurrentGovernanceCycleDay(currentEvent, spaceConfig.cycleStageLengths, now);
    logger.info(`currentGovernanceCycleDay: ${currentGovernanceCycleDay}`);
    logger.info(`currentEvent: ${JSON.stringify(currentEvent)}`);
    const dialogHandler = await discordLogin(config);
    await dialogHandler.sendDailyReminder(
      currentGovernanceCycleDay,
      currentGovernanceCycle,
      space,
      currentEvent.title,
      currentEvent.end,
      proposals
    );
    logger.info('===================================================================');
    return true;
  } catch (e) {
    logger.error(`error sending dailyAlert for ${space}`);
    logger.error(e);
    logger.info('===================================================================');
    return Promise.reject(e);
  }
}
