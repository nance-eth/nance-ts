import { getConfig, calendarPath } from '../configLoader';
import { Nance } from '../nance';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { addSecondsToDate } from '../utils';

const pageId = '';

async function getConfigs() {
  const config = await getConfig()
  const nance = new Nance(config);
  const calendar = new CalendarHandler(calendarPath(config));
  const nextEvents = calendar.getNextEvents();
  const nextVote = nextEvents.filter((event) => { return event.title === 'Snapshot Vote' })[0];
  console.log(nextVote);
  const proposal = (pageId !== '') ? [await nance.proposalHandler.pageIdToProposal(pageId)] : undefined;
  console.log(proposal);
  const now = new Date();
  const voteEnd = (nextVote.end < now) ? addSecondsToDate(now, 60 * 5) : nextVote.end
  nance.votingSetup(voteEnd, proposal);
}

getConfigs();
