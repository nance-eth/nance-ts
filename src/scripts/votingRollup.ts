import axios from 'axios';
import schedule from 'node-schedule';
import {
  addDaysToDate,
  sleep
} from '../utils';
import config from '../config/juicebox/config.juicebox';
import { Nance } from '../nance';
import logger from '../logging';
import { CalendarHandler } from '../calendar/CalendarHandler';

async function getConfigs() {
  const nance = new Nance(config);
  await sleep(3000);
  const endDate = new Date(1654905600 * 1000);
  nance.proposalHandler.getVoteProposals().then((proposals) => {
    nance.dialogHandler.sendVoteRollup(proposals, endDate);
  });
}

getConfigs();
