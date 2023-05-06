import { getCalendar, getConfig } from '../configLoader';
import { sleep } from '../utils';
import { Nance } from '../nance';
import logger from '../logging';
import { CalendarHandler } from '../calendar/CalendarHandler';

const DELAY_SEND_SECONDS = (process.argv[2] === '') ? 30 : Number(process.argv[2] ?? 30);

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const calendar = new CalendarHandler(getCalendar(config));
  const nextEvents = calendar.getNextEvents();
  const nextTemperatureCheck = nextEvents.filter((event) => { return event.title === 'Temperature Check' })[0];
  logger.debug(nextTemperatureCheck);
  logger.debug(`nance will send temperature check setup in ${DELAY_SEND_SECONDS} seconds`)
  await sleep(DELAY_SEND_SECONDS * 1000);
  const proposals = await nance.dProposalHandler.getTemperatureCheckProposals();
  console.log(proposals.length);
  nance.dialogHandler.sendTemperatureCheckRollup(proposals, nextTemperatureCheck.end);
}

main();
