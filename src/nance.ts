/* eslint-disable no-param-reassign */
import { DiscordHandler } from './discord/discordHandler';
import { NotionHandler } from './notion/notionHandler';
import { keys } from './keys';
import {
  getLastSlash
} from './utils';
import logger from './logging';
import { Proposal } from './types';
import { SnapshotHandler } from './snapshot/snapshotHandler';
import { PinataHandler } from './pinata/pinataHandler';

export class Nance {
  private proposalHandler;
  private proposalDataBackupHandler;
  private dialogHandler;
  private votingHandler;
  private discussionInterval: any;

  constructor(
    private config: any
  ) {
    this.proposalHandler = new NotionHandler(keys.NOTION_KEY, this.config);
    this.proposalDataBackupHandler = new PinataHandler(keys.PINATA_KEY);
    this.dialogHandler = new DiscordHandler(keys.DISCORD_KEY, this.config);
    this.votingHandler = new SnapshotHandler(keys.PRIVATE_KEY, keys.PROVIDER_KEY, this.config);
  }

  async setDiscussionInterval(seconds: number) {
    this.discussionInterval = setInterval(this.queryAndSendDiscussions.bind(this), seconds * 1000);
  }

  async clearDiscussionInterval() {
    clearInterval(this.discussionInterval);
  }

  async queryAndSendDiscussions() {
    try {
      const proposalsToDiscuss = await this.proposalHandler.getToDiscuss();
      proposalsToDiscuss.forEach(async (proposal: Proposal) => {
        const threadURL = await this.dialogHandler.startDiscussion(proposal);
        await this.proposalHandler.updateMetaData(
          proposal.hash,
          { [this.config.notion.propertyKeys.discussionThread]: { url: threadURL } }
        );
        logger.info(`${this.config.name}: new proposal ${proposal.title}, ${proposal.url}`);
      });
    } catch (e) {
      logger.error(`${this.config.name}: queryAndSendDiscussions() issue`);
    }
  }

  async temperatureCheckSetup(endDate: Date) {
    const discussionProposals = await this.proposalHandler.getDiscussionProposals();
    Promise.all(discussionProposals.map(async (proposal: Proposal) => {
      const threadId = getLastSlash(proposal.discussionThreadURL);
      await this.dialogHandler.setupPoll(threadId);
      await this.proposalHandler.updateStatusTemperatureCheck(proposal.hash);
    })).then(() => {
      this.dialogHandler.sendTemperatureCheckRollup(discussionProposals, endDate);
      logger.info(`${this.config.name}: temperatureCheckSetup() complete`);
    }).catch((e) => {
      logger.error(`${this.config.name}: temperatureCheckSetup() error: ${e}`);
    });
  }

  pollPassCheck(yesCount: number, noCount: number) {
    const ratio = yesCount / (yesCount + noCount);
    if (yesCount >= this.config.discord.poll.minYesVotes
      && ratio >= this.config.discord.poll.yesNoRatio) {
      return true;
    }
    return false;
  }

  async temperatureCheckClose() {
    const temperatureCheckProposals = await this.proposalHandler.getTemperatureCheckProposals();
    temperatureCheckProposals.forEach(async (proposal: Proposal) => {
      try {
        const threadId = getLastSlash(proposal.discussionThreadURL);
        const pollResults = await this.dialogHandler.getPollVoters(threadId);
        const pass = this.pollPassCheck(
          pollResults.voteYesUsers.length,
          pollResults.voteNoUsers.length
        );
        if (this.config.discord.poll.showResults) {
          await this.dialogHandler.sendPollResults(pollResults, pass, threadId);
        }
        if (pass) await this.proposalHandler.updateStatusVoting(proposal.hash);
        else await this.proposalHandler.updateStatusCancelled(proposal.hash);
        logger.info(`${this.config.name}: temperatureCheckClose() complete`);
      } catch (e) {
        logger.error(`${this.config.name}: temperatureCheckClose() error: ${proposal.url}`);
        logger.error(e);
      }
    });
  }

  async votingSetup(startDate: Date, endDate: Date) {
    this.clearDiscussionInterval();
    const voteProposals = await this.proposalHandler.getVoteProposals();
    await Promise.all(voteProposals.map(async (proposal: Proposal) => {
      const mdString = await this.proposalHandler.getContentMarkdown(proposal.hash);
      proposal.markdown = mdString;
      if (this.config.proposalDataBackup) {
        const ipfsCID = await this.proposalDataBackupHandler.pinProposal(proposal);
        proposal.ipfsURL = `${this.config.ipfsGateway}/${ipfsCID}`;
      }
      const markdownWithAdditions = this.proposalHandler.appendProposal(proposal);
      proposal.markdown = markdownWithAdditions;
      proposal.voteURL = await this.votingHandler.createProposal(
        proposal,
        startDate,
        endDate
      );
      this.proposalHandler.updateVoteAndIPFS(proposal);
      logger.info(`${this.config.name}: ${proposal.title}: ${proposal.voteURL}`);
    }));
    if (voteProposals.length > 0) {
      this.dialogHandler.sendVoteRollup(voteProposals, endDate);
    }
  }
}
