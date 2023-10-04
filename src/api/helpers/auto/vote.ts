import { discordLogin } from '../discord';
import { SpaceInfo } from '../../models';
import { EVENTS } from '../../../constants';
import { SnapshotHandler } from '../../../snapshot/snapshotHandler';
import { DoltHandler } from '../../../dolt/doltHandler';
import { pools } from '../../../dolt/pools';
import { keys } from '../../../keys';
import { dotPin } from '../../../storage/storageHandler';
import { addSecondsToDate, floatToPercentage } from '../../../utils';
import { InternalVoteResults } from '../../../types';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import logger from '../../../logging';

export const voteSetup = async (space: SpaceInfo) => {
  const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
  const proposals = await dolt.getVoteProposals();
  if (space.currentEvent?.title === EVENTS.SNAPSHOT_VOTE && proposals.length > 0) {
    const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, space.config);
    const snapshotVoteSettings = await snapshot.getVotingSettings();
    const start = addSecondsToDate(new Date(), -10);
    // if a space has a period set, a proposal must be submitted with that period
    const end = (snapshotVoteSettings.period)
      ? addSecondsToDate(start, snapshotVoteSettings.period)
      : space.currentEvent?.end;

    Promise.all(proposals.map(async (proposal) => {
      const proposalWithHeading = `# ${proposal.proposalId} - ${proposal.title}${proposal.body}`;
      const ipfsURL = await dotPin(proposalWithHeading);
      const type = (proposal.voteSetup) ? proposal.voteSetup.type : (snapshotVoteSettings.type || 'basic');
      const voteURL = await snapshot.createProposal(
        proposal,
        start,
        end,
        { type, choices: proposal.voteSetup?.choices || space.config.snapshot.choices }
      );
      await dolt.updateVotingSetup({ ...proposal, ipfsURL, voteURL });
    })).then(async () => {
      const dialogHandler = await discordLogin(space.config);
      dialogHandler.sendVoteRollup(proposals, end);
      return true;
    }).catch((e) => {
      logger.error(`${space.name}: votingSetup() error:`);
      logger.error(e);
      return Promise.reject(e);
    });
  }
  return false;
};

export const sendVoteRollup = async (space: SpaceInfo) => {
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
  dialogHandler.logout();
  return true;
};

export const sendQuorumRollup = async (space: SpaceInfo) => {
  const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
  const proposals = await dolt.getVoteProposals(true);
  const snapshot = new SnapshotHandler('', space.config); // dont need private key for this call
  const proposalSnapshotIdStrings = proposals.map((proposal) => { return `"${proposal.voteURL}"`; });
  const voteResults = await snapshot.getProposalVotes(proposalSnapshotIdStrings);
  const proposalsUnderQuorum = voteResults.filter((vote) => {
    return vote.scoresTotal < space.config.snapshot.minTokenPassingAmount;
  }).map((vote) => {
    const findProposal = proposals.find((proposal) => { return proposal.voteURL === vote.voteProposalId; });
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ...findProposal!,
      internalVoteResults: {
        ...vote,
        quorumMet: false
      },
    };
  });
  const dialogHandler = await discordLogin(space.config);
  dialogHandler.sendQuorumRollup(proposalsUnderQuorum, space.currentEvent.end);
};

export const sendVoteEndAlert = async (space: SpaceInfo) => {
  const doltSys = new DoltSysHandler(pools.nance_sys);
  const dialogHandler = await discordLogin(space.config);
  const votingEndAlert = await dialogHandler.sendReminder(
    EVENTS.SNAPSHOT_VOTE,
    space.currentEvent.end,
    'end'
  );
  await doltSys.updateDialogHandlerMessageId(space.name, 'votingEndAlert', votingEndAlert);
  dialogHandler.logout();
  return true;
};

const getVotePercentages = (space: SpaceInfo, voteResults: InternalVoteResults) => {
  const yes = voteResults.scores[space.config.snapshot.choices[0]];
  const no = voteResults.scores[space.config.snapshot.choices[1]];
  const percentageYes = yes / (yes + no);
  const percentageNo = no / (yes + no);
  return {
    [space.config.snapshot.choices[0]]: (Number.isNaN(percentageYes) ? 0 : percentageYes),
    [space.config.snapshot.choices[1]]: (Number.isNaN(percentageNo) ? 0 : percentageNo),
  };
};

const votePassCheck = (space: SpaceInfo, voteResults: InternalVoteResults) => {
  const yes = voteResults.scores[space.config.snapshot.choices[0]];
  return (
    yes >= space.config.snapshot.minTokenPassingAmount
    && voteResults.percentages[space.config.snapshot.choices[0]] >= space.config.snapshot.passingRatio
  );
};

export const voteClose = async (space: SpaceInfo) => {
  const dolt = new DoltHandler(pools[space.name], space.config.propertyKeys);
  const proposals = await dolt.getVoteProposals(true);
  if (proposals.length === 0) return false;
  const proposalSnapshotIdStrings = proposals.map((proposal) => { return `"${proposal.voteURL}"`; });
  const snapshot = new SnapshotHandler('', space.config); // dont need private key for this call
  const voteResults = await snapshot.getProposalVotes(proposalSnapshotIdStrings);
  return Promise.all(voteResults.map(async (vote) => {
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
    const doltSys = new DoltSysHandler(pools.nance_sys);
    return dialogHandler.sendVoteResultsRollup(proposals).then((messageId) => {
      doltSys.updateDialogHandlerMessageId(space.name, 'votingResultsRollup', messageId);
      return true;
    }).catch((e) => {
      return Promise.reject(e);
    });
  });
};

export const deleteVoteEndAlert = async (space: SpaceInfo) => {
  const dialogHandler = await discordLogin(space.config);
  await dialogHandler.deleteMessage(space.dialog.votingEndAlert);
  const doltSys = new DoltSysHandler(pools.nance_sys);
  await doltSys.updateDialogHandlerMessageId(space.name, 'votingEndAlert', '');
  await doltSys.updateDialogHandlerMessageId(space.name, 'votingRollup', '');
  dialogHandler.logout();
  return true;
};
