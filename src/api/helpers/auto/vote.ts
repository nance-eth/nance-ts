import { discordLogin } from '../discord';
import { SpaceAuto } from '../../models';
import { events } from './constants';
import { SnapshotHandler } from '../../../snapshot/snapshotHandler';
import { DoltHandler } from '../../../dolt/doltHandler';
import { pools } from '../../../dolt/pools';
import { keys } from '../../../keys';
import {
  shouldSendVoteRollup,
  shouldSendVoteEndAlert,
  shouldDeleteVoteEndAlert,
  shouldCloseVote
} from './logic';
import { dotPin } from '../../../storage/storageHandler';
import { addSecondsToDate, floatToPercentage } from '../../../utils';
import { InternalVoteResults } from '../../../types';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';

export const handleVoteSetup = async (space: SpaceAuto) => {
  const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
  const proposals = await dolt.getVoteProposals();
  if (space.currentEvent.title === events.SNAPSHOT_VOTE && proposals.length > 0) {
    const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, space.config);
    Promise.allSettled(proposals.map(async (proposal) => {
      const proposalWithHeading = `# ${proposal.proposalId} - ${proposal.title}${proposal.body}`;
      const ipfsURL = await dotPin(proposalWithHeading);
      const voteURL = await snapshot.createProposal(
        proposal,
        addSecondsToDate(new Date(), -10),
        space.currentEvent.end,
        (proposal.voteSetup) ? { type: proposal.voteSetup.type, choices: proposal.voteSetup.choices } : undefined
      );
      await dolt.updateVotingSetup({ ...proposal, ipfsURL, voteURL });
    })).then((a) => {
      console.log(a);
    });
  }
};

export const handleSendVoteRollup = async (space: SpaceAuto) => {
  if (shouldSendVoteRollup(space)) {
    const doltSys = new DoltSysHandler(pools.nance_sys);
    const dialogHandler = await discordLogin(space.config);
    const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
    const proposals = await dolt.getVoteProposals(true);
    const votingRollup = await dialogHandler.sendVoteRollup(
      proposals,
      space.currentEvent.end,
    );
    await doltSys.updateDialogHandlerMessageId(space.name, 'votingRollup', votingRollup);
    await doltSys.updateDialogHandlerMessageId(space.name, 'votingEndAlert', '');
    await doltSys.updateDialogHandlerMessageId(space.name, 'votingResultsRollup', '');
  }
};

export const handleSendVoteEndAlert = async (space: SpaceAuto) => {
  if (shouldSendVoteEndAlert(space)) {
    const doltSys = new DoltSysHandler(pools.nance_sys);
    const dialogHandler = await discordLogin(space.config);
    const votingEndAlert = await dialogHandler.sendReminder(
      events.SNAPSHOT_VOTE,
      space.currentEvent.end,
      'end'
    );
    await doltSys.updateDialogHandlerMessageId(space.name, 'votingEndAlert', votingEndAlert);
  }
};

const getVotePercentages = (space: SpaceAuto, voteResults: InternalVoteResults) => {
  const yes = voteResults.scores[space.config.snapshot.choices[0]];
  const no = voteResults.scores[space.config.snapshot.choices[1]];
  const percentageYes = yes / (yes + no);
  const percentageNo = no / (yes + no);
  return {
    [space.config.snapshot.choices[0]]: (Number.isNaN(percentageYes) ? 0 : percentageYes),
    [space.config.snapshot.choices[1]]: (Number.isNaN(percentageNo) ? 0 : percentageNo),
  };
};

const votePassCheck = (space: SpaceAuto, voteResults: InternalVoteResults) => {
  const yes = voteResults.scores[space.config.snapshot.choices[0]];
  return (
    yes >= space.config.snapshot.minTokenPassingAmount
    && voteResults.percentages[space.config.snapshot.choices[0]] >= space.config.snapshot.passingRatio
  );
};

export const handleVoteClose = async (space: SpaceAuto) => {
  if (shouldCloseVote(space)) {
    const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
    const proposals = await dolt.getVoteProposals(true);
    const proposalSnapshotIdStrings = proposals.map((proposal) => { return `"${proposal.voteURL}"`; });
    const snapshot = new SnapshotHandler('', space.config); // dont need private key for this call
    const voteResults = await snapshot.getProposalVotes(proposalSnapshotIdStrings);
    Promise.all(voteResults.map(async (vote) => {
      const findProposal = proposals.find((proposal) => { return proposal.voteURL === vote.voteProposalId; });
      if (!findProposal) { return; }
      const pass = (votePassCheck(space, vote));
      const percentages = getVotePercentages(space, vote);
      const outcomeEmoji = pass ? space.config.discord.poll.voteCancelledEmoji : space.config.discord.poll.voteCancelledEmoji;
      const outcomePercentage = pass ? floatToPercentage(percentages[space.config.snapshot.choices[0]]) : floatToPercentage(percentages[space.config.snapshot.choices[1]]);
      const outcomeStatus = pass ? space.config.propertyKeys.statusApproved : space.config.propertyKeys.statusCancelled;
      const updatedProposal = {
        ...findProposal,
        status: outcomeStatus,
        internalVoteResults: {
          ...vote,
          percentages,
          outcomeEmoji,
          outcomePercentage,
        },
      };
      await dolt.updateVotingClose(updatedProposal);
    })).then(async () => {
      const dialogHandler = await discordLogin(space.config);
      await dialogHandler.sendVoteResultsRollup(proposals);
    });
  }
};

export const handleDeleteVoteEndAlert = async (space: SpaceAuto) => {
  if (shouldDeleteVoteEndAlert(space)) {
    const dialogHandler = await discordLogin(space.config);
    await dialogHandler.deleteMessage(space.dialog.votingEndAlert);
    const doltSys = new DoltSysHandler(pools.nance_sys);
    await doltSys.updateDialogHandlerMessageId(space.name, 'votingEndAlert', '');
    await doltSys.updateDialogHandlerMessageId(space.name, 'votingRollup', '');
  }
};
