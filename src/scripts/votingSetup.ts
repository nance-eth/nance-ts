import { getCalendar, doltConfig } from '../configLoader';
import { Nance } from '../nance';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { addSecondsToDate } from '../utils';
import { Proposal } from '../types';

const pageId = '';

async function getConfigs() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  const nance = new Nance(config);
  const calendar = new CalendarHandler(getCalendar(config));
  const nextEvents = calendar.getNextEvents();
  const nextVote = nextEvents.filter((event) => { return event.title === 'Snapshot Vote' })[0];
  console.log(nextVote);
  const proposal = await nance.dProposalHandler.getContentMarkdown(pageId) as unknown as Proposal;
  console.log(proposal);
  const now = new Date();
  const voteEnd = (nextVote.end < now) ? addSecondsToDate(now, 60 * 5) : nextVote.end
  nance.votingSetup(voteEnd, [proposal]);
}

getConfigs();
