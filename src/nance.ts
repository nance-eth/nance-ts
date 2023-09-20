/* eslint-disable no-param-reassign */
import { DiscordHandler } from './discord/discordHandler';
import { keys } from './keys';
import {
  getLastSlash as getIdFromURL,
  floatToPercentage,
  addSecondsToDate,
} from './utils';
import logger from './logging';
import { NanceConfig, Proposal, InternalVoteResults } from './types';
import { SnapshotHandler } from './snapshot/snapshotHandler';
import { dotPin } from './storage/storageHandler';
import { DoltHandler } from './dolt/doltHandler';
import { DoltSQL } from './dolt/doltSQL';
import { GovernanceCycle } from './dolt/schema';
import { dbOptions } from './dolt/dbConfig';

export class Nance {
  dialogHandler;
  votingHandler;
  dProposalHandler;
  private discussionInterval: any;

  constructor(
    public config: NanceConfig
  ) {
    this.dialogHandler = new DiscordHandler(config);
    this.votingHandler = new SnapshotHandler(keys.PRIVATE_KEY, this.config);
    this.dProposalHandler = new DoltHandler(new DoltSQL(dbOptions(config.name)), this.config.propertyKeys);
    this.dProposalHandler.localDolt.showActiveBranch().then((res) => {
      logger.info(`dolt branch: ${res}`);
    });
  }

  async clearDiscussionInterval() {
    clearInterval(this.discussionInterval);
    logger.info(`${this.config.name}: clearDiscussionInterval()`);
  }

  pollPassCheck(yesCount: number, noCount: number) {
    const ratio = yesCount / (yesCount + noCount);
    if (yesCount >= this.config.discord.poll.minYesVotes
      && ratio >= this.config.discord.poll.yesNoRatio) {
      return true;
    }
    return false;
  }

  getVotePercentages(voteResults: InternalVoteResults) {
    const yes = voteResults.scores[this.config.snapshot.choices[0]];
    const no = voteResults.scores[this.config.snapshot.choices[1]];
    const percentageYes = yes / (yes + no);
    const percentageNo = no / (yes + no);
    return {
      [this.config.snapshot.choices[0]]: (Number.isNaN(percentageYes) ? 0 : percentageYes),
      [this.config.snapshot.choices[1]]: (Number.isNaN(percentageNo) ? 0 : percentageNo),
    };
  }

  votePassCheck(voteResults: InternalVoteResults) {
    const yes = voteResults.scores[this.config.snapshot.choices[0]];
    if (yes >= this.config.snapshot.minTokenPassingAmount
      && voteResults.percentages[this.config.snapshot.choices[0]]
        >= this.config.snapshot.passingRatio) {
      return true;
    }
    return false;
  }

  async reminder(event: string, date: Date, type: string, url = '') {
    logger.info(`${this.config.name}: reminder() begin...`);
    this.dialogHandler.sendReminder(event, date, type, url).then(() => {
      logger.info(`${this.config.name}: reminder() complete`);
    }).catch((e) => {
      logger.error(`${this.config.name}: reminder() error!`);
      logger.error(e);
    });
  }

  async editTitles(status: string, rollupMessageId?: string) {
    let proposals: Proposal[] = [];
    if (status === 'discussion') { proposals = await this.dProposalHandler.getDiscussionProposals(); }
    if (status === 'temperatureCheck') { proposals = await this.dProposalHandler.getTemperatureCheckProposals(); }
    if (status === 'vote') { proposals = await this.dProposalHandler.getVoteProposals(); }
    proposals.forEach((proposal) => {
      this.dialogHandler.editDiscussionTitle(proposal);
    });
    if (rollupMessageId) { this.dialogHandler.editRollupMessage(proposals, status, rollupMessageId); }
  }

  async temperatureCheckSetup(endDate: Date) {
    logger.info(`${this.config.name}: temperatureCheckSetup() begin...`);
    const discussionProposals = await this.dProposalHandler.assignProposalIds(
      await this.dProposalHandler.getDiscussionProposals()
    );
    console.log(discussionProposals);
    Promise.all(discussionProposals.map(async (proposal: Proposal) => {
      proposal.status = this.config.propertyKeys.statusTemperatureCheck;
      await this.dProposalHandler.updateStatusTemperatureCheckAndProposalId(proposal);
    })).then(() => {
      this.dialogHandler.sendTemperatureCheckRollup(discussionProposals, endDate);
      logger.info(`${this.config.name}: temperatureCheckSetup() complete`);
      logger.info('===================================================================');
    }).catch((e) => {
      logger.error(`${this.config.name}: temperatureCheckSetup() error:`);
      logger.error(e);
    });
  }

  async temperatureCheckClose() {
    logger.info(`${this.config.name}: temperatureCheckClose() begin...`);
    const temperatureCheckProposals = await this.dProposalHandler.getTemperatureCheckProposals();
    await Promise.all(temperatureCheckProposals.map(async (proposal: Proposal) => {
      const threadId = getIdFromURL(proposal.discussionThreadURL);
      const pollResults = await this.dialogHandler.getPollVoters(threadId);
      proposal.temperatureCheckVotes = [pollResults.voteYesUsers.length, pollResults.voteNoUsers.length];
      const pass = this.pollPassCheck(
        pollResults.voteYesUsers.length,
        pollResults.voteNoUsers.length
      );
      proposal.status = (pass) ? this.config.propertyKeys.statusVoting : this.config.propertyKeys.statusCancelled;
      if (this.config.discord.poll.showResults) {
        this.dialogHandler.sendPollResults(pollResults, pass, threadId);
      }
      this.dialogHandler.sendPollResultsEmoji(pass, threadId);
      try { await this.dProposalHandler.updateTemperatureCheckClose(proposal); } catch (e) { logger.error(`dDB: ${e}`); }
    })).then(() => {
      logger.info(`${this.config.name}: temperatureCheckClose() complete`);
      logger.info('===================================================================');
    }).catch((e) => {
      logger.error(`${this.config.name}: temperatureCheckClose() error:`);
      logger.error(e);
    });
  }

  async votingSetup(endDate: Date, proposals?: Proposal[] | undefined): Promise<Proposal[] | void> {
    logger.info(`${this.config.name}: votingSetup() begin...`);
    const voteProposals = proposals || await this.dProposalHandler.getVoteProposals();
    await Promise.all(voteProposals.map(async (proposal: Proposal) => {
      const proposalWithHeading = `# ${proposal.proposalId} - ${proposal.title}${proposal.body}`;
      const ipfsCID = await dotPin(proposalWithHeading);
      proposal.ipfsURL = ipfsCID;
      proposal.voteURL = await this.votingHandler.createProposal(
        proposal,
        addSecondsToDate(new Date(), -10),
        endDate,
        (proposal.voteSetup) ? { type: proposal.voteSetup.type, choices: proposal.voteSetup.choices } : { type: 'basic', choices: this.config.snapshot.choices }
      );
      try { await this.dProposalHandler.updateVotingSetup(proposal); } catch (e) { logger.error(`dDB: ${e}`); }
      logger.debug(`${this.config.name}: ${proposal.title}: ${proposal.voteURL}`);
    })).then(() => {
      if (voteProposals.length > 0) {
        this.dialogHandler.sendVoteRollup(voteProposals, endDate);
        logger.info(`${this.config.name}: votingSetup() complete`);
        logger.info('===================================================================');
        return voteProposals;
      }
      return null;
    }).catch((e) => {
      logger.error(`${this.config.name}: votingSetup() error:`);
      logger.error(e);
    });
  }

  async votingClose(): Promise<Proposal[] | void> {
    logger.info(`${this.config.name}: votingClose() begin...`);
    const voteProposals = await this.dProposalHandler.getVoteProposals(true);
    const voteProposalIdStrings = voteProposals.map((proposal) => {
      return `"${getIdFromURL(proposal.voteURL)}"`;
    });
    const voteResults = await this.votingHandler.getProposalVotes(voteProposalIdStrings);
    return Promise.all(voteResults.map(async (vote) => {
      const proposalMatch = voteProposals.find((proposal) => {
        return getIdFromURL(proposal.voteURL) === vote.voteProposalId;
      });
      if (!proposalMatch) { return; }
      const proposalHash = proposalMatch.hash;
      if (vote.scoresState === 'final') {
        proposalMatch.internalVoteResults = vote;
        proposalMatch.internalVoteResults.percentages = this.getVotePercentages(vote);
        if (this.votePassCheck(proposalMatch.internalVoteResults)) {
          proposalMatch.internalVoteResults.outcomePercentage = floatToPercentage(proposalMatch.internalVoteResults.percentages[this.config.snapshot.choices[0]]);
          proposalMatch.internalVoteResults.outcomeEmoji = this.config.discord.poll.votePassEmoji;
        } else {
          proposalMatch.internalVoteResults.outcomePercentage = floatToPercentage(proposalMatch.internalVoteResults.percentages[this.config.snapshot.choices[1]]);
          proposalMatch.internalVoteResults.outcomeEmoji = this.config.discord.poll.voteCancelledEmoji;
        }
        try { await this.dProposalHandler.updateVotingClose(proposalMatch); } catch (e) { logger.error(`dDB: ${e}`); }
      } else { logger.info(`${this.config.name}: votingClose() results not final yet!`); }
    })).then(() => {
      this.dialogHandler.sendVoteResultsRollup(voteProposals);
      logger.info(`${this.config.name}: votingClose() complete`);
      logger.info('===================================================================');
      return voteProposals;
    }).catch((e) => {
      logger.error(`${this.config.name}: votingClose() error:`);
      logger.error(e);
    });
  }
}
