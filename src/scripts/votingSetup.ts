import { getConfig, calendarPath } from '../configLoader';
import { Nance } from '../nance';
import logger from '../logging';
import { CalendarHandler } from '../calendar/CalendarHandler';

const proposalPageIds = []

async function getConfigs() {
  const config = await getConfig()
  const nance = new Nance(config);
  const calendar = new CalendarHandler(calendarPath);
  const nextEvents = calendar.getNextEvents();
  const nextVote = nextEvents.filter((event) => { return event.title === 'Snapshot Vote' })[0];
  logger.info(nextVote);
  const voteProposals = (proposalPageIds.length > 0 ) ? proposalPageIds.map((pageId) => {
    return nance.proposalHandler.pageIdToProposal(pageId);
  }) : undefined
  nance.votingSetup(nextVote.start, nextVote.end, voteProposals);
}

getConfigs();
