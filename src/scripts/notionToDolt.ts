import { getConfig } from '../configLoader';
import { DoltHandler } from '../dolt/doltHandler';
import { getLastSlash } from '../utils';
import { keys } from '../keys';
import { NotionHandler } from '../notion/notionHandler';
import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { oneLine } from 'common-tags';

const GC = '40';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const dolt = new DoltHandler(
    { database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD }, config.propertyKeys
  );
  const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, keys.INFURA_KEY, config);
  const proposals = await notion.getProposalsByGovernanceCycle(GC);
  const voteResults = await snapshot.getProposalVotes(
    proposals.map((proposal) => { return `"${getLastSlash(proposal.voteURL)}"`; })
  );
  Promise.all(voteResults.map((result) => {
    const proposalMatch = proposals.find((proposal) => {
      return getLastSlash(proposal.voteURL) === result.voteProposalId;
    });
    if (!proposalMatch) { return; }
    if (result.scoresState === 'final') {
      proposalMatch.voteResults = result;
    }
    if (result.scores)
    dolt.updateVotingClose(proposalMatch);
  }));
}

main();