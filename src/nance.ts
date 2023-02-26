/* eslint-disable no-param-reassign */
import { DiscordHandler } from './discord/discordHandler';
import { NotionHandler } from './notion/notionHandler';
import { keys } from './keys';
import {
  getLastSlash as getIdFromURL,
  floatToPercentage,
  cidToLink,
  addSecondsToDate
} from './utils';
import logger from './logging';
import { NanceConfig, Proposal, InternalVoteResults } from './types';
import { SnapshotHandler } from './snapshot/snapshotHandler';
import { dotPin } from './storage/storageHandler';
import { DoltHandler } from './dolt/doltHandler';
import { GovernanceCycle } from './dolt/schema';

export class Nance {
  proposalHandler;
  dialogHandler;
  votingHandler;
  dProposalHandler;
  private discussionInterval: any;

  constructor(
    public config: NanceConfig
  ) {
    this.proposalHandler = new NotionHandler(config);
    this.dialogHandler = new DiscordHandler(config);
    this.votingHandler = new SnapshotHandler(keys.PRIVATE_KEY, this.config);
    this.dProposalHandler = new DoltHandler(
      { database: config.dolt.repo, host: process.env.DOLT_HOST, port: Number(process.env.DOLT_PORT), user: process.env.DOLT_USER, password: process.env.DOLT_PASSWORD },
      this.config.propertyKeys
    );
    this.dProposalHandler.localDolt.showActiveBranch().then((res) => {
      logger.info(`dolt branch: ${res}`);
    });
  }

  async setDiscussionInterval(seconds: number) {
    this.discussionInterval = setInterval(this.queryAndSendDiscussions.bind(this), seconds * 1000);
    logger.info(`${this.config.name}: setDiscussionInterval(${seconds})`);
  }

  async clearDiscussionInterval() {
    clearInterval(this.discussionInterval);
    logger.info(`${this.config.name}: clearDiscussionInterval()`);
  }

  async sendImageReminder(day: string, type: string) {
    const governanceCycle = await this.proposalHandler.getCurrentGovernanceCycle();
    this.dialogHandler.sendImageReminder(day, governanceCycle.toString(), type);
  }

  async incrementGovernanceCycle(governanceCycle: GovernanceCycle) {
    this.proposalHandler.incrementGovernanceCycle();
    this.dProposalHandler.addGovernanceCycleToDb(governanceCycle);
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

  async queryAndSendDiscussions() {
    return this.proposalHandler.getToDiscuss(true).then((proposalsToDiscuss) => {
      return Promise.all(proposalsToDiscuss.map(async (proposal) => {
        proposal.discussionThreadURL = await this.dialogHandler.startDiscussion(proposal);
        const threadId = getIdFromURL(proposal.discussionThreadURL);
        await this.dialogHandler.setupPoll(threadId);
        this.proposalHandler.updateDiscussionURL(proposal);
        proposal.body = (await this.proposalHandler.getContentMarkdown(proposal.hash)).body;
        try {
          await this.dProposalHandler.addProposalToDb(proposal);
        } catch (e) { logger.error('no dDB'); }
        logger.debug(`${this.config.name}: new proposal ${proposal.title}, ${proposal.url}`);
        return proposal.discussionThreadURL;
      }));
    }).catch(() => {
      logger.error(`${this.config.name}: queryAndSendDiscussions() issue`);
      return [];
    });
  }

  async editTitles(status: string, rollupMessageId?: string) {
    let proposals: Proposal[] = [];
    if (status === 'discussion') { proposals = await this.proposalHandler.getDiscussionProposals(); }
    if (status === 'temperatureCheck') { proposals = await this.proposalHandler.getTemperatureCheckProposals(); }
    if (status === 'vote') { proposals = await this.proposalHandler.getVoteProposals(); }
    proposals.forEach((proposal) => {
      this.dialogHandler.editDiscussionTitle(proposal);
    });
    if (rollupMessageId) { this.dialogHandler.editRollupMessage(proposals, status, rollupMessageId); }
  }

  async temperatureCheckSetup(endDate: Date) {
    logger.info(`${this.config.name}: temperatureCheckSetup() begin...`);
    const discussionProposals = await this.proposalHandler.assignProposalIds(
      await this.proposalHandler.getDiscussionProposals()
    );
    Promise.all(discussionProposals.map(async (proposal: Proposal) => {
      proposal.status = this.config.propertyKeys.statusTemperatureCheck;
      await this.proposalHandler.updateStatusTemperatureCheckAndProposalId(proposal);
      try { await this.dProposalHandler.updateStatusTemperatureCheckAndProposalId(proposal); } catch (e) { logger.error('no dDB'); }
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
    const temperatureCheckProposals = await this.proposalHandler.getTemperatureCheckProposals();
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
      if (pass) await this.proposalHandler.updateStatusVoting(proposal.hash);
      else await this.proposalHandler.updateStatusCancelled(proposal.hash);
      try { await this.dProposalHandler.updateTemperatureCheckClose(proposal); } catch (e) { logger.error('no dDB'); }
    })).then(() => {
      logger.info(`${this.config.name}: temperatureCheckClose() complete`);
      logger.info('===================================================================');
    }).catch((e) => {
      logger.error(`${this.config.name}: temperatureCheckClose() error:`);
      logger.error(e);
    });
  }

  async votingSetup(startDate: Date, endDate: Date, proposals?: Proposal[] | undefined): Promise<Proposal[] | void> {
    logger.info(`${this.config.name}: votingSetup() begin...`);
    const voteProposals = proposals || await this.proposalHandler.getVoteProposals();
    await Promise.all(voteProposals.map(async (proposal: Proposal) => {
      proposal.body = (await this.proposalHandler.getContentMarkdown(proposal.hash)).body;
      if (this.config.proposalDataBackup) {
        const proposalWithHeading = `# ${proposal.proposalId} - ${proposal.title}${proposal.body}`;
        const ipfsCID = await dotPin(proposalWithHeading);
        proposal.ipfsURL = cidToLink(ipfsCID, this.config.ipfsGateway);
      }
      const markdownWithAdditions = this.proposalHandler.appendProposal(proposal);
      proposal.body = markdownWithAdditions;
      proposal.voteURL = await this.votingHandler.createProposal(
        proposal,
        addSecondsToDate(new Date(), -1),
        endDate,
        (proposal.voteSetup) ? { type: proposal.voteSetup.type, choices: proposal.voteSetup.choices } : undefined
      );
      proposal.status = await this.proposalHandler.updateVoteAndIPFS(proposal);
      try { await this.dProposalHandler.updateVotingSetup(proposal); } catch (e) { logger.error('no dDB'); }
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
    const voteProposals = await this.proposalHandler.getVoteProposals();
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
          proposalMatch.status = await this.proposalHandler.updateStatusApproved(proposalHash);
        } else {
          proposalMatch.internalVoteResults.outcomePercentage = floatToPercentage(proposalMatch.internalVoteResults.percentages[this.config.snapshot.choices[1]]);
          proposalMatch.internalVoteResults.outcomeEmoji = this.config.discord.poll.voteCancelledEmoji;
          proposalMatch.status = await this.proposalHandler.updateStatusCancelled(proposalHash);
        }
        try { await this.dProposalHandler.updateVotingClose(proposalMatch); } catch (e) { logger.error('no dDB'); }
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

  async syncProposalHandlers() {
    const currentGovernanceCycle = await this.proposalHandler.getCurrentGovernanceCycle();
    const proposals = await this.proposalHandler.getProposalsByGovernanceCycle(currentGovernanceCycle.toString());
    Promise.all(proposals.map(async (proposal) => {
      proposal = await this.proposalHandler.getContentMarkdown(proposal.hash);
      this.dProposalHandler.addProposalToDb(proposal);
    })).catch((e) => { return Promise.reject(e); });
  }
}
