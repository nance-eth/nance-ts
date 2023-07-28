/* eslint-disable no-param-reassign */
import {
  Client as DiscordClient,
  Collection,
  User,
  Intents,
  Message,
  TextChannel,
  ThreadAutoArchiveDuration,
  MessageEmbed,
  EmbedFieldData,
} from 'discord.js';
import logger from '../logging';
import { limitLength, getLastSlash, DEFAULT_DASHBOARD } from '../utils';
import { Proposal, PollResults, NanceConfig, DayHourMinutes } from '../types';

import * as discordTemplates from './discordTemplates';
import { SQLPayout } from '../dolt/schema';
import { getENS } from '../api/helpers/ens';

export class DiscordHandler {
  private discord;
  private roleTag;

  constructor(
    private config: NanceConfig
  ) {
    this.discord = new DiscordClient({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
      ]
    });
    this.discord.login(process.env[this.config.discord.API_KEY]).then(async () => {
      this.discord.on('ready', async (discord) => {
        logger.debug(`Ready! Logged in as ${discord.user.username}`);
      });
    }).catch((e) => {
      logger.error('discord auth failed!');
      logger.error(e);
    });
    this.roleTag = `<@&${this.config.discord.roles.governance}>`;
  }

  ready() {
    return this.discord.isReady();
  }

  logout() {
    logger.info('logging out of discord');
    this.discord.destroy();
  }

  private getAlertChannel(): TextChannel {
    return this.discord.channels.cache.get(this.config.discord.channelIds.proposals) as TextChannel;
  }

  private getChannelById(id: string): TextChannel {
    return this.discord.channels.cache.get(id) as TextChannel;
  }

  private getDailyUpdateChannels(): TextChannel[] {
    return this.config.discord.reminder.channelIds.map((channelId) => {
      return this.discord.channels.cache.get(channelId) as TextChannel;
    });
  }

  async startDiscussion(proposal: Proposal): Promise<string> {
    proposal.url = discordTemplates.getProposalURL(this.config.name, proposal);
    const authorENS = await getENS(proposal.authorAddress);
    const message = discordTemplates.startDiscussionMessage(this.config.propertyKeys.proposalIdPrefix, proposal, authorENS);
    const messageObj = await this.getAlertChannel().send({ embeds: [message] });
    const thread = await messageObj.startThread({
      name: limitLength(proposal.title),
      autoArchiveDuration: 24 * 60 * 7 as ThreadAutoArchiveDuration
    });
    return discordTemplates.threadToURL(thread);
  }

  async setupPoll(messageId: string) {
    const messageObj = await this.getAlertChannel().messages.fetch(messageId);
    await Promise.all([
      messageObj.react(this.config.discord.poll.voteYesEmoji),
      messageObj.react(this.config.discord.poll.voteNoEmoji)
    ]);
  }

  async sendTemperatureCheckRollup(proposals: Proposal[], endDate: Date) {
    const message = discordTemplates.temperatureCheckRollUpMessage(this.config.propertyKeys.proposalIdPrefix, proposals, this.config.name, endDate);
    await this.getAlertChannel().send({ content: this.roleTag, embeds: [message] });
  }

  async sendVoteRollup(proposals: Proposal[], endDate: Date) {
    const message = discordTemplates.voteRollUpMessage(
      `${this.config.snapshot.base}`,
      this.config.propertyKeys.proposalIdPrefix,
      proposals,
      this.config.name,
      endDate
    );
    await this.getAlertChannel().send({ content: this.roleTag, embeds: [message] });
  }

  async sendVoteResultsRollup(proposals: Proposal[]) {
    const message = discordTemplates.voteResultsRollUpMessage(
      DEFAULT_DASHBOARD,
      this.config.name,
      proposals
    );
    await this.getAlertChannel().send({ content: this.roleTag, embeds: [message] });
  }

  async sendReminder(event: string, date: Date, type: string, url = '', deleteTimeOut = 60 * 65) {
    const message = (type === 'start')
      ? discordTemplates.reminderStartMessage(
        event,
        date,
        url
      )
      : discordTemplates.reminderEndMessage(
        event,
        date,
        url
      );
    await this.getAlertChannel().send({ content: this.roleTag, embeds: [message] }).then((messageObj) => {
      setTimeout(
        () => { messageObj.delete().catch((e) => { logger.error(e); }); },
        deleteTimeOut * 1000
      );
    });
  }

  async sendImageReminder(day: string, governanceCycle: string, type: string, noImage = false, timeLeft?: DayHourMinutes, endSeconds?: number) {
    // delete old messages
    Promise.all(
      this.getDailyUpdateChannels().map((channel) => {
        channel.messages.fetch({ limit: 20 }).then((messages) => {
          messages.filter((m) => { return m.author === this.discord.user && m.embeds[0].title === 'Governance Status'; }).map((me) => {
            return me.delete();
          });
        });
        return null;
      })
    );
    const { message, attachments } = (noImage && timeLeft)
      ? discordTemplates.dailyTextReminder(governanceCycle, day, timeLeft, endSeconds, `${DEFAULT_DASHBOARD}/s/${this.config.name}`)
      : discordTemplates.dailyImageReminder(this.config.name, day, governanceCycle, type, this.config.discord.reminder.links[type], this.config.discord.reminder.links.process);
    Promise.all(
      this.getDailyUpdateChannels().map((channel) => {
        return channel.send({ embeds: [message], files: attachments });
      })
    );
  }

  private static async getUserReactions(
    messageObj: Message,
    emoji: string
  ): Promise<string[]> {
    // https://stackoverflow.com/questions/64241315/is-there-a-way-to-get-reactions-on-an-old-message-in-discordjs/64242640#64242640
    const pollReactionsCollection = messageObj.reactions.cache.get(emoji);
    let users = [''];
    if (pollReactionsCollection !== undefined) {
      users = await pollReactionsCollection.users.fetch()
        .then((results: Collection<string, User>) => {
          return results.filter((user): boolean => { return !user.bot; })
            .map((user) => { return user.tag; });
        });
    }
    return users;
  }

  async getPollVoters(messageId: string): Promise<PollResults> {
    const messageObj = await this.getAlertChannel().messages.fetch(messageId);
    const yesVoteUserList = await DiscordHandler.getUserReactions(
      messageObj,
      this.config.discord.poll.voteYesEmoji
    );
    const noVoteUserList = await DiscordHandler.getUserReactions(
      messageObj,
      this.config.discord.poll.voteNoEmoji
    );
    return { voteYesUsers: yesVoteUserList, voteNoUsers: noVoteUserList };
  }

  async sendPollResults(pollResults: PollResults, outcome: boolean, threadId: string) {
    const message = discordTemplates.pollResultsMessage(
      pollResults,
      outcome,
      {
        voteYesEmoji: this.config.discord.poll.voteYesEmoji,
        voteNoEmoji: this.config.discord.poll.voteNoEmoji
      }
    );
    const sendChannel = this.getChannelById(threadId);
    await sendChannel.send({ embeds: [message] });
  }

  async sendPollResultsEmoji(pass: boolean, threadId: string) {
    const messageObj = await this.getAlertChannel().messages.fetch(threadId);
    if (pass) messageObj.react(this.config.discord.poll.voteGoVoteEmoji);
    else messageObj.react(this.config.discord.poll.voteCancelledEmoji);
  }

  async setStatus() {
    this.discord.user?.setActivity(' ');
  }

  async editDiscussionTitle(proposal: Proposal) {
    const messageObj = await this.getAlertChannel().messages.fetch(getLastSlash(proposal.discussionThreadURL));
    proposal.url = discordTemplates.getProposalURL(this.config.name, proposal);
    const authorENS = await getENS(proposal.authorAddress);
    const message = discordTemplates.startDiscussionMessage(this.config.propertyKeys.proposalIdPrefix, proposal, authorENS);
    if (messageObj.embeds[0].title !== message.title || messageObj.embeds[0].url !== proposal.url) {
      messageObj.edit({ embeds: [message] });
      messageObj.thread?.edit({ name: limitLength(proposal.title) });
    }
  }

  async editRollupMessage(proposals: Proposal[], status: string, messageId: string) {
    const messageObj = await this.getAlertChannel().messages.fetch(messageId);
    let message = new MessageEmbed();
    if (status === 'temperatureCheck') { message = discordTemplates.temperatureCheckRollUpMessage(this.config.propertyKeys.proposalIdPrefix, proposals, this.config.name, new Date()); }
    if (status === 'vote') {
      message = discordTemplates.voteRollUpMessage(
        `${this.config.snapshot.base}`,
        this.config.propertyKeys.proposalIdPrefix,
        proposals,
        this.config.snapshot.space,
        new Date());
    }
    const editedMessage = messageObj.embeds[0];
    editedMessage.fields = message.fields;
    editedMessage.description = message.description;
    messageObj.edit({ embeds: [editedMessage] });
  }

  async sendPayoutsTable(payouts: SQLPayout[], governanceCycle: string) {
    const response = discordTemplates.payoutsTable(payouts, governanceCycle, this.config.snapshot.base, this.config.propertyKeys.proposalIdPrefix);
    await this.getChannelById(this.config.discord.channelIds.bookkeeping).send({ embeds: [response.message] });
  }

  async createTransactionThread(nonce: number, operation: string, oldDistributionLimit: number, newDistributionLimit: number, links: EmbedFieldData[]) {
    const message = discordTemplates.transactionThread(nonce, operation, links);
    const thread = await this.getChannelById(this.config.discord.channelIds.transactions).send({ embeds: [message] }).then((messageObj) => {
      return messageObj.startThread({
        name: limitLength(message.title ?? 'thread'),
        autoArchiveDuration: 24 * 60 * 7 as ThreadAutoArchiveDuration
      });
    });
    return thread.id;
  }

  async editTransactionMessage(messageId: string, nonce: number, operation: string, links: EmbedFieldData[]) {
    const messageObj = await this.getChannelById(this.config.discord.channelIds.transactions).messages.fetch(messageId);
    const editedMessage = messageObj.embeds[0];
    const message = discordTemplates.transactionThread(nonce, operation, links);
    // only edit description
    editedMessage.title = message.title;
    editedMessage.description = message.description;
    messageObj.edit({ embeds: [editedMessage] });
  }

  async sendTransactionSummary(threadId: string, addPayouts: SQLPayout[], removePayouts: SQLPayout[], oldDistributionLimit: number, newDistributionLimit: number) {
    const message1 = discordTemplates.transactionSummary(this.config.propertyKeys.proposalIdPrefix, addPayouts);
    const message2 = discordTemplates.transactionSummary(this.config.propertyKeys.proposalIdPrefix, undefined, removePayouts);
    const message3 = discordTemplates.transactionSummary(this.config.propertyKeys.proposalIdPrefix, undefined, undefined, oldDistributionLimit, newDistributionLimit, undefined);

    await this.getChannelById(threadId).send({ embeds: [message3, message1, message2] });
  }

  async sendProposalDiff(threadId: string, diffText: string, hash: string) {
    const message = discordTemplates.proposalDiff(this.config.name, diffText, hash);
    await this.getChannelById(threadId).send(message);
  }

  async sendProposalArchive(proposal: Proposal) {
    const messageObj = await this.getAlertChannel().messages.fetch(getLastSlash(proposal.discussionThreadURL));
    const message = discordTemplates.archiveDiscussionMessage(proposal);
    // keep url the same
    message.url = messageObj.embeds[0].url;
    messageObj.edit({ embeds: [message] });
    messageObj.thread?.edit({ name: limitLength(message.title || proposal.title) });
    // send alert to thread
    const archiveMessage = discordTemplates.proposalArchiveAlert();
    await messageObj.thread?.send({ content: archiveMessage });
  }
}
