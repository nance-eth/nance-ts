import { Nance } from '../nance';
import { getConfig, getCalendar } from '../configLoader';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { sleep } from '../utils';

async function getConfigs() {
  const config = await getConfig()
  const nance = new Nance(config);
  await sleep(2000);
  const calendar = new CalendarHandler(getCalendar(config));
  const nextEvents = calendar.getNextEvents();
  const nextVote = nextEvents.filter((event) => { return event.title === 'Snapshot Vote' })[0];
  nance.dProposalHandler.getVoteProposals(true).then((proposals) => {
    nance.dialogHandler.sendVoteRollup(proposals, nextVote.end);
  });
}

getConfigs();
