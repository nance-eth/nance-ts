import { getConfig, calendarPath } from '../configLoader';
import { Nance } from '../nance';
import logger from '../logging';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { Proposal } from '../types';

const pageId = '';

async function getConfigs() {
  const config = await getConfig()
  const nance = new Nance(config);
  const calendar = new CalendarHandler(calendarPath);
  const nextEvents = calendar.getNextEvents();
  const nextVote = nextEvents.filter((event) => { return event.title === 'Snapshot Vote' })[0];
  console.log(nextVote);
  const proposal = await nance.proposalHandler.pageIdToProposal(pageId);
  console.log(proposal);
  nance.votingSetup(new Date(), nextVote.end, [proposal]);
}

getConfigs();
