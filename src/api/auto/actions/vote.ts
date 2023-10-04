import { discordLogin } from '../../helpers/discord';
import { EVENTS } from '../../../constants';
import { SnapshotHandler } from '../../../snapshot/snapshotHandler';
import { DoltHandler } from '../../../dolt/doltHandler';
import { pools } from '../../../dolt/pools';
import { keys } from '../../../keys';
import { dotPin } from '../../../storage/storageHandler';
import { addSecondsToDate, floatToPercentage } from '../../../utils';
import { InternalVoteResults, NanceConfig } from '../../../types';
import { DoltSysHandler } from '../../../dolt/doltSysHandler';
import logger from '../../../logging';

export const voteSetup = async (config: NanceConfig, date: Date) => {
  const dolt = new DoltHandler(pools[config.name], config.propertyKeys);
  const proposals = await dolt.getVoteProposals();
  if (proposals.length > 0) {
    const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, config);
    const snapshotVoteSettings = await snapshot.getVotingSettings();
    const start = addSecondsToDate(new Date(), -10);
    // if a space has a period set, a proposal must be submitted with that period
    const end = (snapshotVoteSettings.period)
      ? addSecondsToDate(start, snapshotVoteSettings.period)
      : date;

    Promise.all(proposals.map(async (proposal) => {
      const proposalWithHeading = `# ${proposal.proposalId} - ${proposal.title}${proposal.body}`;
      const ipfsURL = await dotPin(proposalWithHeading);
      const type = (proposal.voteSetup) ? proposal.voteSetup.type : (snapshotVoteSettings.type || 'basic');
      const voteURL = await snapshot.createProposal(
        proposal,
        start,
        end,
        { type, choices: proposal.voteSetup?.choices || config.snapshot.choices }
      );
      await dolt.updateVotingSetup({ ...proposal, ipfsURL, voteURL });
    })).then(async () => {
      const dialogHandler = await discordLogin(config);
      dialogHandler.sendVoteRollup(proposals, end);
      return true;
    }).catch((e) => {
      logger.error(`${config.name}: votingSetup() error:`);
      logger.error(e);
      return Promise.reject(e);
    });
  }
  return false;
};

export const sendVoteRollup = async (config: NanceConfig, endDate: Date) => {
  const doltSys = new DoltSysHandler(pools.nance_sys);
  const dialogHandler = await discordLogin(config);
  const dolt = new DoltHandler(pools[config.name], config.propertyKeys);
  const proposals = await dolt.getVoteProposals(true);
  const votingRollup = await dialogHandler.sendVoteRollup(
    proposals,
    endDate,
  );
  await doltSys.updateDialogHandlerMessageId(config.name, 'votingRollup', votingRollup);
  await doltSys.updateDialogHandlerMessageId(config.name, 'votingEndAlert', '');
  await doltSys.updateDialogHandlerMessageId(config.name, 'votingResultsRollup', '');
  dialogHandler.logout();
  return true;
};

export const sendQuorumRollup = async (config: NanceConfig, endDate: Date) => {
  const dolt = new DoltHandler(pools[config.name], config.propertyKeys);
  const proposals = await dolt.getVoteProposals(true);
  const snapshot = new SnapshotHandler('', config); // dont need private key for this call
  const proposalSnapshotIdStrings = proposals.map((proposal) => { return `"${proposal.voteURL}"`; });
  const voteResults = await snapshot.getProposalVotes(proposalSnapshotIdStrings);
  const proposalsUnderQuorum = voteResults.filter((vote) => {
    return vote.scoresTotal < config.snapshot.minTokenPassingAmount;
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
  if (proposalsUnderQuorum.length === 0) return;
  const dialogHandler = await discordLogin(config);
  dialogHandler.sendQuorumRollup(proposalsUnderQuorum, endDate);
};

export const sendVoteEndAlert = async (config: NanceConfig, endDate: Date) => {
  const doltSys = new DoltSysHandler(pools.nance_sys);
  const dialogHandler = await discordLogin(config);
  const votingEndAlert = await dialogHandler.sendReminder(
    EVENTS.SNAPSHOT_VOTE,
    endDate,
    'end'
  );
  await doltSys.updateDialogHandlerMessageId(config.name, 'votingEndAlert', votingEndAlert);
  dialogHandler.logout();
  return true;
};

const getVotePercentages = (config: NanceConfig, voteResults: InternalVoteResults) => {
  const yes = voteResults.scores[config.snapshot.choices[0]];
  const no = voteResults.scores[config.snapshot.choices[1]];
  const percentageYes = yes / (yes + no);
  const percentageNo = no / (yes + no);
  return {
    [config.snapshot.choices[0]]: (Number.isNaN(percentageYes) ? 0 : percentageYes),
    [config.snapshot.choices[1]]: (Number.isNaN(percentageNo) ? 0 : percentageNo),
  };
};

const votePassCheck = (config: NanceConfig, voteResults: InternalVoteResults) => {
  const yes = voteResults.scores[config.snapshot.choices[0]];
  return (
    yes >= config.snapshot.minTokenPassingAmount
    && voteResults.percentages[config.snapshot.choices[0]] >= config.snapshot.passingRatio
  );
};

export const voteClose = async (config: NanceConfig) => {
  const dolt = new DoltHandler(pools[config.name], config.propertyKeys);
  const proposals = await dolt.getVoteProposals(true);
  if (proposals.length === 0) return false;
  const proposalSnapshotIdStrings = proposals.map((proposal) => { return `"${proposal.voteURL}"`; });
  const snapshot = new SnapshotHandler('', config); // dont need private key for this call
  const voteResults = await snapshot.getProposalVotes(proposalSnapshotIdStrings);
  return Promise.all(voteResults.map(async (vote) => {
    const findProposal = proposals.find((proposal) => { return proposal.voteURL === vote.voteProposalId; });
    if (!findProposal) { return; }
    const pass = (votePassCheck(config, vote));
    const percentages = getVotePercentages(config, vote);
    const outcomeEmoji = pass ? config.discord.poll.voteCancelledEmoji : config.discord.poll.voteCancelledEmoji;
    const outcomePercentage = pass ? floatToPercentage(percentages[config.snapshot.choices[0]]) : floatToPercentage(percentages[config.snapshot.choices[1]]);
    const outcomeStatus = pass ? config.propertyKeys.statusApproved : config.propertyKeys.statusCancelled;
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
    const dialogHandler = await discordLogin(config);
    const doltSys = new DoltSysHandler(pools.nance_sys);
    return dialogHandler.sendVoteResultsRollup(proposals).then((messageId) => {
      doltSys.updateDialogHandlerMessageId(config.name, 'votingResultsRollup', messageId);
      return true;
    }).catch((e) => {
      return Promise.reject(e);
    });
  });
};

export const deleteVoteEndAlert = async (config: NanceConfig, messageId: string) => {
  const dialogHandler = await discordLogin(config);
  await dialogHandler.deleteMessage(messageId);
  const doltSys = new DoltSysHandler(pools.nance_sys);
  await doltSys.updateDialogHandlerMessageId(config.name, 'votingEndAlert', '');
  await doltSys.updateDialogHandlerMessageId(config.name, 'votingRollup', '');
  dialogHandler.logout();
  return true;
};
