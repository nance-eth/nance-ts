import { Nance } from '../nance';
import { NanceExtensions } from '../extensions';
import { getConfig } from '../configLoader';
import { Proposal } from '../types';
import logger from '../logging';
import { sleep, getLastSlash as getIdFromURL, floatToPercentage } from '../utils';
import { JSONProposalsToMd } from '../github/tableMaker';

const approvedFilter = {
  property: 'Status',
  select: {
    equals: 'Approved',
  },
}

async function notionToGithubDB() {
  const config  = await getConfig();
  const nance = new Nance(config);
  await sleep(1000);
  const nanceExt = new NanceExtensions(config);
  
  const approvedProposals = await nance.proposalHandler.queryNotionDb(approvedFilter);
  const voteProposalIdStrings = approvedProposals.map((proposal) => {
    return `"${getIdFromURL(proposal.voteURL)}"`;
  });
  const voteResults = await nance.votingHandler.getProposalVotes(voteProposalIdStrings);
  await Promise.all(voteResults.map(async (vote) => {
    const proposalMatch = approvedProposals.find((proposal) => {
      return getIdFromURL(proposal.voteURL) === vote.voteProposalId;
    });
    if (!proposalMatch) { return; }
    const proposalHash = proposalMatch.hash;
    proposalMatch.governanceCycle = 27;
    proposalMatch.url = `/GC${proposalMatch.governanceCycle}/${proposalMatch.proposalId}.md`;
    if (vote.scoresState === 'final') {
      proposalMatch.voteResults = vote;
      proposalMatch.voteResults.percentages = nance.getVotePercentages(vote);
      if (nance.votePassCheck(proposalMatch.voteResults)) {
        proposalMatch.voteResults.outcomePercentage = floatToPercentage(proposalMatch
          .voteResults.percentages[config.snapshot.choices[0]]);
        proposalMatch.voteResults.outcomeEmoji = config.discord.poll.votePassEmoji;
        //await nance.proposalHandler.updateStatusApproved(proposalHash);
      } else {
        proposalMatch.voteResults.outcomePercentage = floatToPercentage(proposalMatch
          .voteResults.percentages[config.snapshot.choices[1]]);
        proposalMatch.voteResults.outcomeEmoji = config.discord.poll.voteCancelledEmoji;
        //await nance.proposalHandler.updateStatusCancelled(proposalHash);
      }
    } else { logger.info(`${config.name}: votingClose() results not final yet!`); }
  })).then(() => {
    const mdTable = JSONProposalsToMd(approvedProposals);
    // nanceExt.stageCycleDb(approvedProposals).then((dbFileChanges) => {
    //   nanceExt.githubProposalHandler.GithubAPI.createCommitOnBranch(dbFileChanges, 'Update DB');
    // });
  });
}

notionToGithubDB();
