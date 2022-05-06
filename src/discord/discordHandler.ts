import {
  AnyChannel,
  Client as DiscordClient,
  Intents,
  Message,
  MessageComponent,
  MessageEmbed,
  TextChannel,
  ThreadAutoArchiveDuration,
} from 'discord.js';

import * as discordTemplates from './discordTemplates';

export class DiscordHandler {
  private discord;

  constructor(
    discordKey: string,
    private config: any
  ) {
    this.discord = new DiscordClient({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
      ]
    });
    this.discord.login(discordKey).then(async () => {
      this.discord.on('ready', async (discord) => {
        console.log(`Ready! Logged in as ${discord.user.username}`);
      });
    });
  }

  ready() {
    return this.discord.isReady();
  }

  private getAlertChannel(): TextChannel {
    return this.discord.channels.cache.get(this.config.channelId) as TextChannel;
  }

  async sendEmbed(text: string, channelId: string): Promise<Message<boolean>> {
    const message = new MessageEmbed()
      .setTitle(text);
    const channel = this.discord.channels.cache.get(channelId) as TextChannel;
    const sentMessage = await channel.send({ embeds: [message] });
    return sentMessage;
  }

  async startDiscussion(toSend: any): Promise<string> {
    const message = discordTemplates.startDiscussionMessage(toSend.category, toSend.url);
    const messageObj = await this.getAlertChannel().send(message);
    const thread = await messageObj.startThread({
      name: toSend.title,
      autoArchiveDuration: 24 * 60 * 7 as ThreadAutoArchiveDuration
    });
    return discordTemplates.threadToURL(thread);
  }

  async setupPoll(messageId: string) {
    const messageObj = await this.getAlertChannel().messages.fetch(messageId);
    if (this.discord.user) {
      if (messageObj.author.id === this.discord.user.id) {
        messageObj.edit(discordTemplates.setupPollMessage(messageObj));
      }
      await Promise.all([
        messageObj.react(this.config.poll.voteYesEmoji),
        messageObj.react(this.config.poll.voteNoEmoji)
      ]);
    }
  }

  async sendTemperatureCheckRollup(proposals: any, endTime: Date) {
    const message = discordTemplates.temperatureCheckRollUpMessage(proposals, endTime);
    await this.getAlertChannel().send(message);
  }
}
