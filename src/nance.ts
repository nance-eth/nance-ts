import { DiscordHandler } from './discord/discordHandler';
import { NotionHandler } from './notion/notionHandler';
import { keys } from './keys';
import {
  getLastSlash,
  addDaysToDate
} from './utils';
import logger from './logging';
import { INance, Proposal } from './types';

export class Nance {
  private proposalHandler;
  private dialogHandler;
  private discussionInterval: any;

  constructor(
    private config: any
  ) {
    this.proposalHandler = new NotionHandler(keys.NOTION_KEY, this.config);
    this.dialogHandler = new DiscordHandler(keys.DISCORD_KEY, this.config);
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
    try {
      const discussionProposals = await this.proposalHandler.getDiscussionProposals();
      discussionProposals.forEach(async (proposal: Proposal) => {
        const threadId = getLastSlash(proposal.discussionThreadURL);
        await this.dialogHandler.setupPoll(threadId);
      });
      await this.dialogHandler.sendTemperatureCheckRollup(discussionProposals, endDate);
      logger.info(`${this.config.name}: temperatureCheckSetup() complete`);
    } catch (e) {
      logger.error(`${this.config.name}: temperatureCheckSetup() issue`);
    }
  }

  pollPassCheck(yesCount: number, noCount: number) {
    const ratio = yesCount / (yesCount + noCount);
    if (yesCount >= this.config.poll.minYesVotes && ratio >= this.config.poll.yesNoRatio) {
      return true;
    }
    return false;
  }

  async temperatureCheckClose() {
    try {
      const temperatureCheckProposals = await this.proposalHandler.getTemperatureCheckProposals();
      temperatureCheckProposals.forEach(async (proposal: Proposal) => {
        const threadId = getLastSlash(proposal.discussionThreadURL);
        const pollResults = await this.dialogHandler.getPollVoters(threadId);
        const outcome = this.pollPassCheck(
          pollResults.voteYesUsers.length,
          pollResults.voteNoUsers.length
        );
        if (this.config.discord.poll.showResults) {
          await this.dialogHandler.sendPollResults(pollResults, outcome, threadId);
        }
        await this.proposalHandler.updateMetaData(
          proposal.hash,
          {
            [this.config.notion.propertyKeys.status]: {
              select: {
                name: (outcome)
                  ? this.config.notion.propertyKeys.statusVoting
                  : this.config.notion.propertyKeys.statusCancelled
              }
            }
          }
        );
      });
    } catch (e) {
      logger.error(`${this.config.name}: temperatureCheckClose() issue`);
      logger.error(e);
    }
  }
}
