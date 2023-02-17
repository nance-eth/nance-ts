import { getConfig } from '../configLoader';
import { dbOptions } from '../dolt/dbConfig';
import { DoltHandler } from '../dolt/doltHandler';
import { SnapshotHandler } from '../snapshot/snapshotHandler';

async function main() {
  const config = await getConfig();
  const dolt = new DoltHandler(dbOptions(config.dolt.repo), config.propertyKeys);
  const currentGovernanceCycle = 41;
  const snapshot = new SnapshotHandler('', config);
  for (let i = 0; i <= currentGovernanceCycle; i += 1) {
    const proposals = await dolt.getProposalsByGovernanceCycle(i.toString());
    const proposalSnapshotIds = proposals.map((proposal) => { return `"${(proposal.voteURL)}"`; }).filter((id) => { return id !== '""'});
    const voteResults = await snapshot.getProposalVotes(proposalSnapshotIds);
    Promise.all(voteResults.map((result) => {
      const proposalMatch = proposals.find((proposal) => {
        return proposal.voteURL === result.voteProposalId;
      });
      if (!proposalMatch) { return; }
      if (result.scoresState === 'final') {
        proposalMatch.internalVoteResults = result;
      }
      if (result.scores)
      dolt.updateVotingClose(proposalMatch);
    }));
    console.log(`${i}: ${proposalSnapshotIds.length}`)
  }
}

main();