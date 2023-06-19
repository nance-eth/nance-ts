import { Nance } from '../nance';
import { doltConfig } from '../configLoader';
import { CalendarHandler } from '../calendar/CalendarHandler';
import { sleep } from '../utils';

async function getConfigs() {
  const { config, calendarText } = await doltConfig(process.env.CONFIG || '');
  const nance = new Nance(config);
  await sleep(2000);
  const calendar = new CalendarHandler(calendarText);
  const nextEvents = calendar.getNextEvents();
  const nextVote = nextEvents.filter((event) => { return event.title === 'Snapshot Vote' })[0];
  nance.dProposalHandler.getVoteProposals(true).then((proposals) => {
    nance.dialogHandler.sendVoteRollup(proposals, nextVote.end);
  });
}

getConfigs();
