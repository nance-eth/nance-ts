import axios from 'axios';
import schedule from 'node-schedule';
import {
  addSecondsToDate,
  sleep
} from '../utils';
import config from '../config/juicebox/config.juicebox';
import { Nance } from '../nance';
import logger from '../logging';
import { CalendarHandler } from '../calendar/CalendarHandler';

async function getConfigs() {
  const nance = new Nance(config);
  await sleep(2000);
  const now = new Date();
  nance.votingSetup(now, new Date(1656115200000));
}

getConfigs();
