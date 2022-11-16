import { Nance } from '../nance';
import { getConfig, calendarPath } from '../configLoader';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { sleep } from '../utils';

async function getConfigs() {
  const config = await getConfig()
  const nance = new Nance(config);
  await sleep(2000);
  const calendar = new CalendarHandler(calendarPath(config));
  const nextEvents = calendar.getNextEvents();
  const nextVote = nextEvents.filter((event) => { return event.title === 'Snapshot Vote' })[0];
  nance.proposalHandler.getVoteProposals().then((proposals) => {
    nance.dialogHandler.sendVoteRollup(proposals, nextVote.end);
  });
}

getConfigs();
