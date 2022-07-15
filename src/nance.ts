/* eslint-disable no-param-reassign */
import { DiscordHandler } from './discord/discordHandler';
import { NotionHandler } from './notion/notionHandler';
import { keys } from './keys';
import {
  getLastSlash as getIdFromURL,
  floatToPercentage
} from './utils';
import logger from './logging';
import { Proposal, VoteResults } from './types';
import { SnapshotHandler } from './snapshot/snapshotHandler';
import { PinataHandler } from './pinata/pinataHandler';
import { DeeplHandler } from './translate/deeplHandler';
import { GithubHandler } from './github/githubHandler';

export class Nance {
  proposalHandler;
  proposalDataBackupHandler;
  dialogHandler;
  votingHandler;
  translationHandler;
  githubHandler;
  private discussionInterval: any;

  constructor(
    private config: any
  ) {
    this.proposalHandler = new NotionHandler(keys.NOTION_KEY, this.config);
    this.proposalDataBackupHandler = new PinataHandler(keys.PINATA_KEY);
    this.dialogHandler = new DiscordHandler(keys.DISCORD_KEY, this.config);
    this.votingHandler = new SnapshotHandler(keys.PRIVATE_KEY, keys.PROVIDER_KEY, this.config);
    this.translationHandler = new DeeplHandler(keys.DEEPL_KEY);
    this.githubHandler = new GithubHandler(
      keys.GITHUB_KEY,
      this.config.translation.storage.user,
      this.config.translation.storage.repo
    );
  }

  async setDiscussionInterval(seconds: number) {
    this.discussionInterval = setInterval(this.queryAndSendDiscussions.bind(this), seconds * 1000);
    logger.info(`${this.config.name}: setDiscussionInterval(${seconds})`);
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

  getVotePercentages(voteResults: VoteResults) {
    const yes = voteResults.scores[this.config.snapshot.choices[0]];
    const no = voteResults.scores[this.config.snapshot.choices[1]];
    const percentageYes = yes / (yes + no);
    const percentageNo = no / (yes + no);
    return {
      [this.config.snapshot.choices[0]]: (Number.isNaN(percentageYes) ? 0 : percentageYes),
      [this.config.snapshot.choices[1]]: (Number.isNaN(percentageNo) ? 0 : percentageNo),
    };
  }

  votePassCheck(voteResults: VoteResults) {
    const yes = voteResults.scores[this.config.snapshot.choices[0]];
    if (yes >= this.config.snapshot.minTokenPassingAmount
      && voteResults.percentages[this.config.snapshot.choices[0]]
        >= this.config.snapshot.passingRatio) {
      return true;
    }
    return false;
  }

  async reminder(event: string, endDate: Date) {
    logger.info(`${this.config.name}: reminder() begin...`);
    this.dialogHandler.sendReminder(event, endDate).then(() => {
      logger.info(`${this.config.name}: voteReminder() complete`);
    }).catch((e) => {
      logger.error(`${this.config.name}: voteReminder() error!`);
      logger.error(e);
    });
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
        logger.debug(`${this.config.name}: new proposal ${proposal.title}, ${proposal.url}`);
      });
    } catch (e) {
      logger.error(`${this.config.name}: queryAndSendDiscussions() issue`);
    }
  }

  async temperatureCheckSetup(endDate: Date) {
    logger.info(`${this.config.name}: temperatureCheckSetup() begin...`);
    let nextGovernanceVersion = 0;
    const discussionProposals = await this.proposalHandler.assignProposalIds(
      await this.proposalHandler.getDiscussionProposals()
    );
    Promise.all(discussionProposals.map(async (proposal: Proposal) => {
      const threadId = getIdFromURL(proposal.discussionThreadURL);
      if (this.config.translation) {
        nextGovernanceVersion = Number(await this.githubHandler.getContent('VERSION')) + 1;
        const mdString = await this.proposalHandler.getContentMarkdown(proposal.hash);
        const translationLanguage = this.config.translation.targetLanguage;
        const translatedMdString = await this.translationHandler.translate(
          mdString,
          translationLanguage
        );
        proposal.translationURL = await this.githubHandler.pushContent(
          `GC${nextGovernanceVersion}/${proposal.proposalId}_${translationLanguage}.md`,
          translatedMdString
        );
      }
      await this.dialogHandler.setupPoll(threadId);
      await this.proposalHandler.updateStatusTemperatureCheckAndProposalId(proposal);
    })).then(() => {
      if (discussionProposals.length > 0) {
        this.dialogHandler.sendTemperatureCheckRollup(discussionProposals, endDate);
        this.githubHandler.updateContent('VERSION', String(nextGovernanceVersion));
        logger.info(`${this.config.name}: temperatureCheckSetup() complete`);
        logger.info('===================================================================');
      }
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
      const pass = this.pollPassCheck(
        pollResults.voteYesUsers.length,
        pollResults.voteNoUsers.length
      );
      if (this.config.discord.poll.showResults) {
        this.dialogHandler.sendPollResults(pollResults, pass, threadId);
      }
      this.dialogHandler.sendPollResultsEmoji(pass, threadId);
      if (pass) await this.proposalHandler.updateStatusVoting(proposal.hash);
      else await this.proposalHandler.updateStatusCancelled(proposal.hash);
    })).then(() => {
      logger.info(`${this.config.name}: temperatureCheckClose() complete`);
      logger.info('===================================================================');
    }).catch((e) => {
      logger.error(`${this.config.name}: temperatureCheckClose() error:`);
      logger.error(e);
    });
  }

  async votingSetup(startDate: Date, endDate: Date) {
    logger.info(`${this.config.name}: votingSetup() begin...`);
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
      logger.debug(`${this.config.name}: ${proposal.title}: ${proposal.voteURL}`);
    })).then(() => {
      if (voteProposals.length > 0) {
        this.dialogHandler.sendVoteRollup(voteProposals, endDate);
        logger.info(`${this.config.name}: votingSetup() complete`);
        logger.info('===================================================================');
      }
    }).catch((e) => {
      logger.error(`${this.config.name}: votingSetup() error:`);
      logger.error(e);
    });
  }

  async votingClose() {
    logger.info(`${this.config.name}: votingClose() begin...`);
    const voteProposals = await this.proposalHandler.getVoteProposals();
    const voteProposalIdStrings = voteProposals.map((proposal) => {
      return `"${getIdFromURL(proposal.voteURL)}"`;
    });
    const voteResults = await this.votingHandler.getProposalVotes(voteProposalIdStrings);
    await Promise.all(voteResults.map(async (vote) => {
      const proposalMatch = voteProposals.find((proposal) => {
        return getIdFromURL(proposal.voteURL) === vote.voteProposalId;
      });
      if (!proposalMatch) { return; }
      const proposalHash = proposalMatch.hash;
      if (vote.scoresState === 'final') {
        proposalMatch.voteResults = vote;
        proposalMatch.voteResults.percentages = this.getVotePercentages(vote);
        if (this.votePassCheck(proposalMatch.voteResults)) {
          proposalMatch.voteResults.outcomePercentage = floatToPercentage(proposalMatch
            .voteResults.percentages[this.config.snapshot.choices[0]]);
          proposalMatch.voteResults.outcomeEmoji = this.config.discord.poll.votePassEmoji;
          proposalMatch.status = await this.proposalHandler.updateStatusApproved(proposalHash);
        } else {
          proposalMatch.voteResults.outcomePercentage = floatToPercentage(proposalMatch
            .voteResults.percentages[this.config.snapshot.choices[1]]);
          proposalMatch.voteResults.outcomeEmoji = this.config.discord.poll.voteCancelledEmoji;
          proposalMatch.status = await this.proposalHandler.updateStatusCancelled(proposalHash);
        }
      } else { logger.info(`${this.config.name}: votingClose() results not final yet!`); }
    })).then(() => {
      this.dialogHandler.sendVoteResultsRollup(voteProposals);
      logger.info(`${this.config.name}: votingClose() complete`);
      logger.info('===================================================================');
    }).catch((e) => {
      logger.error(`${this.config.name}: votingClose() error:`);
      logger.error(e);
    });
  }
}
