import { getConfig, calendarPath } from '../configLoader';
import { Nance } from '../nance';
import logger from '../logging';
import { CalendarHandler } from '../calendar/CalendarHandler';

async function getConfigs() {
  const config = await getConfig()
  const nance = new Nance(config);
  const calendar = new CalendarHandler(calendarPath);
  const nextEvents = calendar.getNextEvents();
  const nextVote = nextEvents.filter((event) => { return event.title === 'Snapshot Vote' })[0];
  logger.info(nextVote);
  nance.votingSetup(nextVote.start, nextVote.end);
}

getConfigs();
