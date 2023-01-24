import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';
import { NotionHandler } from '../notion/notionHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { addSecondsToDate } from '../utils';
import { GovernanceCycle } from '../dolt/schema';

async function main(){
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const dolt = new DoltHandler(
    { database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD }, config.propertyKeys
  );
  const treasury = new NanceTreasury(config, dolt);
  const { number: numberV2} = await treasury.getCurrentConfiguration('V2');
  const { number: numberV3, start: startV3, duration: durationV3 } = await treasury.getCurrentConfiguration('V3');
  const startDatetime = addSecondsToDate(new Date(startV3.toNumber() * 1000), durationV3.toNumber());
  const cycleNumber = await notion.getCurrentGovernanceCycle();
  console.log(await dolt.getCurrentGovernanceCycle());
  const governance: GovernanceCycle = {
    cycleNumber,
    startDatetime,
    endDatetime: addSecondsToDate(startDatetime, durationV3.toNumber()),
    jbV1FundingCycle: cycleNumber,
    jbV2FundingCycle: numberV2.toNumber() + 1,
    jbV3FundingCycle: numberV3.toNumber() + 1,
    acceptingProposals: true
  }
  console.log(governance);
  dolt.addGovernanceCycleToDb(governance);
}

main();