import { SnapshotHandler } from '../snapshotHandler';
import { NotionHandler } from '../../notion/notionHandler';
import { keys } from '../../keys';
import { addSecondsToDate, dateToUnixTimeStamp, sleep } from '../../utils';
import { getConfig } from '../../configLoader';

async function createProposal() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const proposals = await notion.getVoteProposals();
  const PROPOSAL = await notion.getContentMarkdown(proposals[0].hash);
  console.log(proposals);
  const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, keys.PROVIDER_KEY, config);
  const now = new Date();
  await sleep(2000);
  snapshot.createProposal(PROPOSAL, now, addSecondsToDate(now, 60 * 10)).then((res) => {
    console.log(res);
  }).then((e) => {
    console.log(e);
  });
}

createProposal();
