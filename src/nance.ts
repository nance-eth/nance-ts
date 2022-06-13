/* eslint-disable no-param-reassign */
import { DiscordHandler } from './discord/discordHandler';
import { NotionHandler } from './notion/notionHandler';
import { keys } from './keys';
import {
  getLastSlash as getIdFromURL
} from './utils';
import logger from './logging';
import { Proposal, VoteResults } from './types';
import { SnapshotHandler } from './snapshot/snapshotHandler';
import { PinataHandler } from './pinata/pinataHandler';

export class Nance {
  proposalHandler;
  proposalDataBackupHandler;
  dialogHandler;
  votingHandler;
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

  pollPassCheck(yesCount: number, noCount: number) {
    const ratio = yesCount / (yesCount + noCount);
    if (yesCount >= this.config.discord.poll.minYesVotes
      && ratio >= this.config.discord.poll.yesNoRatio) {
      return true;
    }
    return false;
  }

  votePassCheck(voteResults: VoteResults) {
    const yes = voteResults.votes[this.config.snapshot.choices[0]];
    const no = voteResults.votes[this.config.snapshot.choices[1]];
    const ratio = yes / (yes + no);
    if (voteResults.totalVotes >= this.config.snapshot.quroum
      && ratio >= this.config.snapshot.passingRatio) {
      return true;
    }
    return false;
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
    logger.info(`${this.config.name}: temperatureCheckSetup() begin...`);
    const discussionProposals = await this.proposalHandler.assignProposalIds(
      await this.proposalHandler.getDiscussionProposals()
    );
    Promise.all(discussionProposals.map(async (proposal: Proposal) => {
      const threadId = getIdFromURL(proposal.discussionThreadURL);
      await this.dialogHandler.setupPoll(threadId);
      await this.proposalHandler.updateStatusTemperatureCheckAndProposalId(proposal);
    })).then(() => {
      this.dialogHandler.sendTemperatureCheckRollup(discussionProposals, endDate);
      logger.info(`${this.config.name}: temperatureCheckSetup() complete`);
    }).catch((e) => {
      logger.error(`${this.config.name}: temperatureCheckSetup() error: ${e}`);
    });
  }

  async temperatureCheckClose() {
    const temperatureCheckProposals = await this.proposalHandler.getTemperatureCheckProposals();
    await Promise.all(temperatureCheckProposals.map(async (proposal: Proposal) => {
      const threadId = getIdFromURL(proposal.discussionThreadURL);
      const pollResults = await this.dialogHandler.getPollVoters(threadId);
      const pass = this.pollPassCheck(
        pollResults.voteYesUsers.length,
        pollResults.voteNoUsers.length
      );
      if (this.config.discord.poll.showResults) {
        this.dialogHandler.sendPollResults(pollResults, pass, threadId);
      }
      if (pass) await this.proposalHandler.updateStatusVoting(proposal.hash);
      else await this.proposalHandler.updateStatusCancelled(proposal.hash);
    })).then(() => {
      logger.info(`${this.config.name}: temperatureCheckClose() complete`);
    }).catch((e) => {
      logger.error(`${this.config.name}: temperatureCheckClose() error: ${e}`);
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
    })).then(() => {
      if (voteProposals.length > 0) {
        this.dialogHandler.sendVoteRollup(voteProposals, endDate);
      }
    }).catch((e) => {
      logger.error(`${this.config.name}: votingSetup() error:`);
      logger.error(e);
    });
  }

  async votingClose() {
    const voteProposals = await this.proposalHandler.getVoteProposals();
    const voteProposalIdStrings = voteProposals.map((proposal) => {
      return `"${getIdFromURL(proposal.voteURL)}"`;
    });
    const voteResults = await this.votingHandler.getProposalVotes(voteProposalIdStrings);
    await Promise.all(voteResults.map(async (vote) => {
      if (vote.scoresState === 'final') {
        const statusUpdate = this.votePassCheck(vote) ? 'Approved' : 'Cancelled';
      }
    }));
  }
}
