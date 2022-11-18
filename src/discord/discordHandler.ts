/* eslint-disable no-param-reassign */
import {
  Client as DiscordClient,
  Collection,
  User,
  Intents,
  Message,
  MessageEmbed,
  TextChannel,
  ThreadAutoArchiveDuration,
} from 'discord.js';
import logger from '../logging';
import { limitLength } from '../utils';
import { Proposal, PollResults } from '../types';

import * as discordTemplates from './discordTemplates';

export class DiscordHandler {
  private discord;
  private roleTag;

  constructor(
    private config: any
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
        logger.info(`Ready! Logged in as ${discord.user.username}`);
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

  async sendEmbed(text: string, channelId: string): Promise<Message<boolean>> {
    const message = new MessageEmbed()
      .setTitle(text);
    const channel = this.discord.channels.cache.get(channelId) as TextChannel;
    const sentMessage = await channel.send({ embeds: [message] });
    return sentMessage;
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

  private static async getUserReactions(
    messageObj: Message,
    emoji: string
  ): Promise<string[]> {
    // https://stackoverflow.com/questions/64241315/is-there-a-way-to-get-reactions-on-an-old-message-in-discordjs/64242640#64242640
    const pollReactionsCollection = messageObj.reactions.cache.get(emoji);
    let users = [''];
    if (pollReactionsCollection !== undefined) {
      users = <string[]> await pollReactionsCollection.users.fetch()
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
    const sendChannel = this.discord.channels.cache.get(threadId) as TextChannel;
    await sendChannel.send({ content: this.roleTag, embeds: [message] });
  }

  async sendPollResultsEmoji(pass: boolean, threadId: string) {
    const messageObj = await this.getAlertChannel().messages.fetch(threadId);
    if (pass) messageObj.react(this.config.discord.poll.voteGoVoteEmoji);
    else messageObj.react(this.config.discord.poll.voteCancelledEmoji);
  }
}
