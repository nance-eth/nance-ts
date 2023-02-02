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
} from 'discord.js';
import logger from '../logging';
import { limitLength, getLastSlash } from '../utils';
import { Proposal, PollResults, NanceConfig } from '../types';

import * as discordTemplates from './discordTemplates';
import { SQLPayout } from '../dolt/schema';

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
    this.roleTag = `<@&${this.config.discord.alertRole}>`;
  }

  ready() {
    return this.discord.isReady();
  }

  logout() {
    this.discord.destroy();
  }

  private getAlertChannel(): TextChannel {
    return this.discord.channels.cache.get(this.config.discord.channelId) as TextChannel;
  }

  private getChannelById(id: string): TextChannel {
    return this.discord.channels.cache.get(id) as TextChannel;
  }

  private getDailyUpdateChannels(): TextChannel[] {
    return this.config.reminder.channelIds.map((channelId) => {
      return this.discord.channels.cache.get(channelId) as TextChannel;
    });
  }

  async startDiscussion(proposal: Proposal): Promise<string> {
    proposal.url = discordTemplates.juiceToolUrl(proposal, this.config.name);
    const message = discordTemplates.startDiscussionMessage(proposal);
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
    const message = discordTemplates.temperatureCheckRollUpMessage(proposals, this.config.name, endDate);
    await this.getAlertChannel().send({ content: this.roleTag, embeds: [message] });
  }

  async sendVoteRollup(proposals: Proposal[], endDate: Date) {
    const message = discordTemplates.voteRollUpMessage(
      `${this.config.snapshot.base}/${this.config.snapshot.space}`,
      proposals,
      this.config.name,
      endDate
    );
    await this.getAlertChannel().send({ content: this.roleTag, embeds: [message] });
  }

  async sendVoteResultsRollup(proposals: Proposal[]) {
    const message = discordTemplates.voteResultsRollUpMessage(
      this.config.votingResultsDashboard,
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

  async sendImageReminder(day: string, governanceCycle: string, type: string) {
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
    const { message, attachments } = discordTemplates.dailyImageReminder(day, governanceCycle, type, this.config.reminder.links[type], this.config.reminder.links.process);
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
    proposal.url = discordTemplates.juiceToolUrl(proposal, this.config.name);
    const message = discordTemplates.startDiscussionMessage(proposal);
    if (messageObj.embeds[0].title !== message.title) {
      messageObj.edit({ embeds: [message] });
      messageObj.thread?.edit({ name: limitLength(proposal.title) });
    }
  }

  async editRollupMessage(proposals: Proposal[], status: string, messageId: string) {
    const messageObj = await this.getAlertChannel().messages.fetch(messageId);
    let message = new MessageEmbed();
    if (status === 'temperatureCheck') { message = discordTemplates.temperatureCheckRollUpMessage(proposals, this.config.name, new Date()); }
    if (status === 'vote') {
      message = discordTemplates.voteRollUpMessage(
        `${this.config.snapshot.base}/${this.config.snapshot.space}`,
        proposals,
        this.config.snapshot.space,
        new Date());
    }
    const edittedMessage = messageObj.embeds[0];
    edittedMessage.fields = message.fields;
    edittedMessage.description = message.description;
    messageObj.edit({ embeds: [edittedMessage] });
  }

  async sendPayoutsTable(payouts: SQLPayout[], governanceCycle: string) {
    const response = discordTemplates.payoutsTable(payouts, governanceCycle, `${this.config.snapshot.base}/${this.config.snapshot.space}`, this.config.propertyKeys.proposalIdPrefix);
    await this.getChannelById(this.config.discord.bookkeepingId).send({ embeds: [response.message], content: `${response.toAlert} your reoccuring payout expires next cycle! submit a proposal to renew today!` });
  }
}
