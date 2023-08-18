import { doltConfig, getConfig } from '../configLoader';
import { sleep } from '../utils';
import { Nance } from '../nance';
import logger from '../logging';
import { CalendarHandler } from '../calendar/CalendarHandler';

const DELAY_SEND_SECONDS = (process.argv[2] === '') ? 30 : Number(process.argv[2] ?? 30);

async function main() {
  const { config, calendarText } = await doltConfig(process.env.CONFIG || '');
  console.log(calendarText)
  const nance = new Nance(config);
  const calendar = new CalendarHandler(calendarText);
  const nextEvents = calendar.getNextEvents();
  console.log(nextEvents);
  const nextTemperatureCheck = nextEvents.filter((event) => { return event.title === 'Temperature Check' })[0];
  logger.debug(nextTemperatureCheck);
  logger.debug(`nance will send temperature check setup in ${DELAY_SEND_SECONDS} seconds`)
  await sleep(DELAY_SEND_SECONDS * 1000);
  nance.temperatureCheckSetup(nextTemperatureCheck.end);
}

main();
