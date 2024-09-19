/* eslint-disable max-lines */
import {
  Client as DiscordClient,
  Collection,
  User,
  GatewayIntentBits,
  Message,
  TextChannel,
  ThreadAutoArchiveDuration,
  EmbedBuilder,
  EmbedField,
  AttachmentBuilder,
  escapeMarkdown,
  ForumChannel,
  ThreadChannel,
} from "discord.js";
import { isEqual } from "lodash";
import { Proposal, PollResults, NanceConfig, SQLPayout } from "@nance/nance-sdk";
import logger from "../logging";
import { limitLength, getLastSlash, dateToUnixTimeStamp } from "../utils";
import { DEFAULT_DASHBOARD, EMOJI } from "@/constants";
import { removeReacts, threadToURL } from "./helpers";
import * as t from "./templates";
import { getENS } from "@/api/helpers/ens";
import { pollActionRow } from "./button/poll";

const SILENT_FLAG = 1 << 12;

export class DiscordHandler {
  private discord;
  private roleTag;
  private spaceURL: string;

  constructor(
    private config: NanceConfig
  ) {
    this.discord = new DiscordClient({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
      ]
    });
    this.discord.login(process.env[this.config.discord.API_KEY]).then(async () => {
      this.discord.on("ready", async (discord) => {
        logger.debug(`Ready! Logged in as ${discord.user.username}`);
      });
    }).catch((e) => {
      logger.error("discord auth failed!");
      logger.error(e);
    });
    this.roleTag = `<@&${this.config.discord.roles.governance}>`;
    this.spaceURL = `${DEFAULT_DASHBOARD}/s/${this.config.name}`;
  }

  ready() {
    return this.discord.isReady();
  }

  logout() {
    logger.info("logging out of discord");
    this.discord.destroy();
  }

  getAlertChannel(): TextChannel {
    return this.discord.channels.cache.get(this.config.discord.channelIds.proposals) as TextChannel;
  }

  private getChannelById(id: string): TextChannel {
    return this.discord.channels.cache.get(id) as TextChannel;
  }

  private getDailyUpdateChannels(): TextChannel[] {
    const channels = [] as TextChannel[];
    this.config.discord.reminder.channelIds.forEach((channelId) => {
      try {
        this.discord.channels.cache.get(channelId);
        channels.push(this.discord.channels.cache.get(channelId) as TextChannel);
      } catch (e) {
        logger.error(`Could not get channel ${channelId} for space ${this.config.name}`);
      }
    });
    return channels;
  }

  async startDiscussion(proposal: Proposal): Promise<string> {
    const authorENS = await getENS(proposal.authorAddress);
    const { customDomain } = this.config;
    const message = await t.startDiscussionMessage(
      this.config.name,
      this.config.proposalIdPrefix,
      proposal,
      authorENS,
      customDomain
    );
    try {
      if (proposal.status === "Draft") {
        // only support Draft thread creation for MoonDAO who uses forum
        throw Error();
      }
      const messageObj = await this.getAlertChannel().send({ embeds: [message] });
      const thread = await messageObj.startThread({
        name: limitLength(proposal.title),
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
      });
      return threadToURL(thread);
    } catch (e) {
      // if send fails try as forum (kind of a hack could improve later)
      const channelId = (proposal.status === "Draft" && this.config.discord.channelIds.ideas) ?
        this.config.discord.channelIds.ideas :
        this.config.discord.channelIds.proposals;
      const title = message.data.title || "Unknown Title";
      const channel = this.getChannelById(channelId) as unknown as ForumChannel;
      const embeds = [message];
      const messageObj = await channel.threads.create({
        name: limitLength(title),
        message: { embeds },
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
      });
      return threadToURL(messageObj);
    }
  }

  async setupPoll(messageId: string) {
    try {
      const messageObj = await this.getAlertChannel().messages.fetch(messageId);
      await Promise.all([
        messageObj.react(EMOJI.YES),
        messageObj.react(EMOJI.NO),
      ]);
      return await Promise.resolve();
    } catch (e) {
      try {
        // if send fails, do blind poll for moondao (kind of a hack could improve later)
        const channel = this.getAlertChannel() as unknown as ForumChannel;
        const post = await channel.threads.fetch(messageId) as ThreadChannel;
        const messageObj = await post.fetchStarterMessage();
        const pollResults = t.blindPollMessage({ yes: 0, no: 0 });
        await messageObj?.edit({
          embeds: [messageObj.embeds[0], pollResults],
          components: [pollActionRow]
        });
        return Promise.resolve();
      } catch (finalError) {
        return Promise.reject(finalError);
      }
    }
  }

  async sendTemperatureCheckRollup(proposals: Proposal[], endDate: Date) {
    const message = t.temperatureCheckRollUpMessage(this.config.proposalIdPrefix, proposals, this.config.name, endDate);
    return this.getAlertChannel().send({ content: this.roleTag, embeds: [message] }).then((messageObj) => {
      return messageObj.id;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

  async sendVoteRollup(proposals: Proposal[], endDate: Date) {
    const message = t.voteRollUpMessage(
      this.spaceURL,
      this.config.proposalIdPrefix,
      proposals,
      this.config.name,
      endDate
    );
    const content = this.config.discord.roles.governance ? this.roleTag : undefined;
    return this.getAlertChannel().send({ content, embeds: [message] }).then((messageObj) => {
      return messageObj.id;
    });
  }

  async sendQuorumRollup(proposals: Proposal[], endDate: Date) {
    const message = t.proposalsUnderQuorumMessage(this.spaceURL, this.config.proposalIdPrefix, proposals, this.config.snapshot.minTokenPassingAmount, this.config.name);
    return this.getAlertChannel()
      .send(
        {
          content: `:hotsprings: ${this.roleTag} proposals under quorum! Voting ends at <t:${dateToUnixTimeStamp(endDate)}:f>(<t:${dateToUnixTimeStamp(endDate)}:R>) :hotsprings:`,
          embeds: [message]
        }).then((messageObj) => {
        messageObj.crosspost();
        return messageObj.id;
      });
  }

  async sendVoteResultsRollup(proposals: Proposal[]) {
    const message = t.voteResultsRollUpMessage(
      this.spaceURL,
      this.config.name,
      this.config.proposalIdPrefix,
      proposals
    );
    return this.getAlertChannel().send({ content: this.roleTag, embeds: [message] }).then((messageObj) => {
      return messageObj.id;
    });
  }

  async editVoteResultsRollup(messageId: string, proposals: Proposal[]) {
    const messageObj = await this.getAlertChannel().messages.fetch(messageId);
    const message = t.voteResultsRollUpMessage(
      this.spaceURL,
      this.config.name,
      this.config.proposalIdPrefix,
      proposals
    );
    messageObj.edit({ embeds: [message], flags: [SILENT_FLAG] });
  }

  async sendReminder(event: string, date: Date, type: string) {
    const message = (type === "start")
      ? t.reminderStartMessage(
        event,
        date,
      )
      : t.reminderEndMessage(
        event,
        date,
      );
    return this.getAlertChannel().send({ content: this.roleTag, embeds: [message] }).then((messageObj) => {
      messageObj.crosspost();
      return messageObj.id;
    });
  }

  async sendDailyReminder(
    day: number,
    governanceCycle: number,
    space: string,
    type: string,
    endDate: Date,
    proposals: Proposal[],
  ) {
    const endSeconds = endDate.getTime() / 1000;
    const link = this.spaceURL;
    const reminderType = this.config.discord.reminder.type;
    let message: EmbedBuilder;
    let attachments: AttachmentBuilder[];
    if (reminderType === "image") {
      try {
        ({ message, attachments } = await t.dailyImageReminder(
          day,
          this.config.discord.reminder.imagesCID,
          governanceCycle,
          type,
          proposals,
          space,
          this.config.proposalIdPrefix,
          link,
          endSeconds)
        );
      } catch (e) {
        logger.error(`Could not send daily image reminder for ${this.config.name}`);
        logger.error(e);
        ({ message, attachments } = t.dailyBasicReminder(governanceCycle, day, type, proposals, space, this.config.proposalIdPrefix, endSeconds));
      }
    } else { // default to basic
      ({ message, attachments } = t.dailyBasicReminder(governanceCycle, day, type, proposals, space, this.config.proposalIdPrefix, endSeconds, this.config.customDomain));
    }
    const channelsSent = await Promise.all(this.getDailyUpdateChannels().map(async (channel) => {
      if (!channel) return undefined as unknown as TextChannel;
      // delete old messages
      const messages = await channel.messages.fetch({ limit: 20 });
      const deletePromises = messages.filter((m) => {
        return m.author === this.discord.user && m.embeds[0]?.title === "Governance Status";
      }).map((me) => { return me.delete(); });
      await Promise.all(deletePromises);
      try {
        channel.send({ embeds: [message], files: attachments, flags: [SILENT_FLAG] });
        return channel;
      } catch (e) {
        logger.error(`Could not send daily update to ${channel.name} for ${this.config.name}`);
        logger.error(e);
        return undefined as unknown as TextChannel;
      }
    }));
    if (channelsSent.includes(undefined as unknown as TextChannel)) {
      return Promise.reject(Error(`Could not send daily update to ${this.config.name}`));
    }
    return true;
  }

  memberTagOrName(user: User) {
    const memberObj = user.client.guilds.cache.get(this.config.discord.guildId)?.members.cache.get(user.id);
    if (memberObj) return memberObj.toString();
    return escapeMarkdown(user.displayName);
  }

  private async getUserReactions(
    messageObj: Message,
    emoji: string
  ): Promise<{ verified: string[], unverified: string[] }> {
    // https://stackoverflow.com/questions/64241315/is-there-a-way-to-get-reactions-on-an-old-message-in-discordjs/64242640#64242640
    const pollReactionsCollection = messageObj.reactions.cache.get(emoji);
    let users: string[] = [];
    const unverified: string[] = [];
    // fetch members
    await this.discord.guilds.cache.get(this.config.discord.guildId)?.members.fetch();
    const { verifyRole } = this.config.discord.poll;
    if (pollReactionsCollection !== undefined) {
      users = await pollReactionsCollection.users.fetch()
        .then((results: Collection<string, User>) => {
          return results.filter((user): boolean => {
            if (!verifyRole) return !user.bot;
            const member = messageObj?.guild?.members.cache.get(user.id);
            if (!member) return false;
            const hasRole = member.roles.cache.has(verifyRole);
            if (!hasRole && !user.bot) unverified.push(this.memberTagOrName(user));
            return !user.bot && hasRole;
          }).map((user) => { return this.memberTagOrName(user); });
        });
    }
    return { verified: users, unverified };
  }

  async getPollVoters(messageId: string): Promise<PollResults> {
    try {
      const messageObj = await this.getAlertChannel().messages.fetch(messageId);
      const yesVoteUserList = await this.getUserReactions(
        messageObj,
        EMOJI.YES
      );
      const noVoteUserList = await this.getUserReactions(
        messageObj,
        EMOJI.NO
      );
      return {
        voteYesUsers: yesVoteUserList.verified,
        voteNoUsers: noVoteUserList.verified,
        unverifiedUsers: [...yesVoteUserList.unverified, ...noVoteUserList.unverified]
      };
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async sendPollResults(pollResults: PollResults, outcome: boolean, threadId: string) {
    const message = t.pollResultsMessage(
      pollResults,
      outcome,
      {
        voteYesEmoji: EMOJI.YES,
        voteNoEmoji: EMOJI.NO
      }
    );
    const sendChannel = this.getChannelById(threadId);
    await sendChannel.send({ embeds: [message] });
  }

  async sendPollResultsEmoji(pass: boolean, threadId: string) {
    const messageObj = await this.getAlertChannel().messages.fetch(threadId);
    if (pass) messageObj.react(EMOJI.VOTE);
    else messageObj.react(EMOJI.CANCELLED);
  }

  async sendBlindPollResults(
    threadId: string,
    yes: number,
    no: number,
    pass: boolean
  ) {
    try {
      const channel = this.getAlertChannel() as unknown as ForumChannel;
      const post = await channel.threads.fetch(threadId) as ThreadChannel;
      const messageObj = await post.fetchStarterMessage();
      const results = t.blindPollMessage({ yes, no }, pass);
      await messageObj?.edit({
        embeds: [messageObj.embeds[0], results],
        components: []
      });
      return true;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async setStatus() {
    this.discord.user?.setActivity(" ");
  }

  async editDiscussionMessage(proposal: Proposal, forceEdit = false) {
    try {
      const messageObj = await this.getAlertChannel().messages.fetch(getLastSlash(proposal.discussionThreadURL));
      const authorENS = await getENS(proposal.authorAddress);
      const { customDomain } = this.config;
      const message = await t.startDiscussionMessage(
        this.config.name,
        this.config.proposalIdPrefix,
        proposal,
        authorENS,
        customDomain
      );
      if (
        messageObj.embeds[0].title !== message.data.title
        || !isEqual(messageObj.embeds[0].fields, message.data.fields)
        || forceEdit
      ) {
        messageObj.edit({ embeds: [message] });
        messageObj.thread?.edit({ name: limitLength(proposal.title) });
      }
    } catch (e) {
      const channel = this.getAlertChannel() as unknown as ForumChannel;
      const post = await channel.threads.fetch(getLastSlash(proposal.discussionThreadURL)) as ThreadChannel;
      const messageObj = await post.fetchStarterMessage();
      const authorENS = await getENS(proposal.authorAddress);
      const { customDomain } = this.config;
      const message = await t.startDiscussionMessage(
        this.config.name,
        this.config.proposalIdPrefix,
        proposal,
        authorENS,
        customDomain
      );
      const title = `${this.config.proposalIdPrefix}${proposal.proposalId}: ${proposal.title}`;
      const currentEmbeds = messageObj?.embeds || [];
      const embeds = [message, ...currentEmbeds];
      await post.edit({ name: limitLength(title) });
      await messageObj?.edit({ embeds });
    }
  }

  async editRollupMessage(proposals: Proposal[], status: string, messageId: string) {
    const messageObj = await this.getAlertChannel().messages.fetch(messageId);
    let message = new EmbedBuilder();
    if (status === "temperatureCheck") { message = t.temperatureCheckRollUpMessage(this.config.proposalIdPrefix, proposals, this.config.name, new Date()); }
    if (status === "vote") {
      message = t.voteRollUpMessage(
        `${DEFAULT_DASHBOARD}`,
        this.config.proposalIdPrefix,
        proposals,
        this.config.snapshot.space,
        new Date());
    }
    const editedMessage = messageObj.embeds[0];
    message.setTitle(editedMessage.title);
    message.setDescription(editedMessage.description);
    message.setURL(editedMessage.url);
    messageObj.edit({ embeds: [editedMessage] });
  }

  async sendPayoutsTable(payouts: SQLPayout[], governanceCycle: number) {
    const response = t.payoutsTable(payouts, governanceCycle, this.config.name, this.config.proposalIdPrefix);
    await this.getChannelById(this.config.discord.channelIds.bookkeeping).send({ embeds: [response.message] });
  }

  async createTransactionThread(nonce: number, operation: string, links: EmbedField[]) {
    const message = t.transactionThread(nonce, operation, links);
    const thread = await this.getChannelById(this.config.discord.channelIds.transactions).send({ embeds: [message] }).then((messageObj) => {
      return messageObj.startThread({
        name: limitLength(message.data.title ?? "thread"),
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
      });
    });
    return thread.id;
  }

  async editTransactionMessage(messageId: string, nonce: number, operation: string, links: EmbedField[]) {
    const messageObj = await this.getChannelById(this.config.discord.channelIds.transactions).messages.fetch(messageId);
    const editedMessage = messageObj.embeds[0];
    const message = t.transactionThread(nonce, operation, links);
    // only edit description
    message.setTitle(editedMessage.title);
    message.setDescription(editedMessage.description);
    messageObj.edit({ embeds: [editedMessage] });
  }

  async sendTransactionSummary(
    governanceCycle: number,
    threadId: string,
    deadline: Date,
    oldDistributionLimit: number,
    newDistributionLimit: number,
    addPayouts: SQLPayout[],
    removePayouts: SQLPayout[],
    encodeReconfigureFundingCycle?: string,
    viemFormatReconfig?: any,
  ) {
    const message = t.transactionSummary(
      this.config.name,
      deadline,
      this.config.proposalIdPrefix,
      oldDistributionLimit,
      newDistributionLimit,
      addPayouts,
      removePayouts,
    );
    await this.getChannelById(threadId).send(message);
    if (encodeReconfigureFundingCycle) {
      const attachment = new AttachmentBuilder(Buffer.from(encodeReconfigureFundingCycle, "utf-8"), { name: `GC${governanceCycle}_hex.txt` });
      await this.getChannelById(threadId).send({ files: [attachment] });
    }
    if (viemFormatReconfig) {
      const attachment = new AttachmentBuilder(Buffer.from(viemFormatReconfig, "utf-8"), { name: `GC${governanceCycle}_viem.txt` });
      await this.getChannelById(threadId).send({ files: [attachment] });
    }
  }

  async sendProposalDiff(proposal: Proposal) {
    const { customDomain } = this.config;
    const threadId = getLastSlash(proposal.discussionThreadURL);
    const message = t.proposalDiff(this.config.name, proposal, customDomain);
    await this.getChannelById(threadId).send(message);
  }

  async sendProposalArchive(proposal: Proposal) {
    try {
      const messageObj = await this.getAlertChannel().messages.fetch(getLastSlash(proposal.discussionThreadURL));
      const message = t.archiveDiscussionMessage(proposal);
      // keep url the same
      message.setURL(messageObj.embeds[0].url);
      messageObj.edit({ embeds: [message] });
      messageObj.thread?.edit({ name: limitLength(proposal.title) });
      // send alert to thread
      const archiveMessage = t.proposalArchiveAlert();
      await messageObj.thread?.send({ content: archiveMessage });
    } catch (e) {
      const channel = this.getAlertChannel() as unknown as ForumChannel;
      const post = await channel.threads.fetch(getLastSlash(proposal.discussionThreadURL)) as ThreadChannel;
      const messageObj = await post.fetchStarterMessage();
      await post.edit({ name: `[ARCHIVED] ${limitLength(proposal.title)}` });
      await messageObj?.edit({
        embeds: [t.archiveDiscussionMessage(proposal)],
        components: []
      });
      await post.send({ content: t.proposalArchiveAlert() });
    }
  }

  async sendProposalUnarchive(proposal: Proposal) {
    try {
      const messageObj = await this.getAlertChannel().messages.fetch(getLastSlash(proposal.discussionThreadURL));
      const authorENS = await getENS(proposal.authorAddress);
      const { customDomain } = this.config;
      const message = await t.startDiscussionMessage(
        this.config.name,
        this.config.proposalIdPrefix,
        proposal,
        authorENS,
        customDomain
      );
      // keep url the same
      message.setURL(messageObj.embeds[0].url);
      messageObj.edit({ embeds: [message] });
      messageObj.thread?.edit({ name: limitLength(proposal.title) });
      // send alert to thread
      const archiveMessage = t.proposalUnarchiveAlert();
      await messageObj.thread?.send({ content: archiveMessage });
    } catch (e) {
      const channel = this.getAlertChannel() as unknown as ForumChannel;
      const post = await channel.threads.fetch(getLastSlash(proposal.discussionThreadURL)) as ThreadChannel;
      const messageObj = await post.fetchStarterMessage();
      const title = `${this.config.proposalIdPrefix}s${proposal.proposalId}: ${proposal.title}`;
      await post.edit({ name: limitLength(title) });
      const authorENS = await getENS(proposal.authorAddress);
      const { customDomain } = this.config;
      const message = await t.startDiscussionMessage(
        this.config.name,
        this.config.proposalIdPrefix,
        proposal,
        authorENS,
        customDomain
      );
      const pollResults = t.blindPollMessage({ yes: 0, no: 0 });
      await messageObj?.edit({
        embeds: [message, pollResults],
        components: [pollActionRow]
      });
      await post.send({ content: t.proposalUnarchiveAlert() });
    }
  }

  async deleteMessage(messageId: string) {
    try {
      const messageObj = await this.getAlertChannel().messages.fetch(messageId);
      const res = await messageObj.delete();
      logger.info(`Deleted message ${messageId} with result ${res}`);
      return res;
    } catch { // delete thread
      const channel = this.getAlertChannel() as unknown as ForumChannel;
      const post = await channel.threads.fetch(messageId) as ThreadChannel;
      const res = await post.delete();
      logger.info(`Deleted forum post ${messageId} with result ${res}`);
      return res;
    }
  }

  async sendProposalDelete(proposal: Proposal) {
    try {
      const messageObj = await this.getAlertChannel().messages.fetch(getLastSlash(proposal.discussionThreadURL));
      const message = t.deletedDiscussionMessage(proposal);
      messageObj.edit({ embeds: [message] });
      messageObj.thread?.edit({ name: limitLength(proposal.title) });
      // send alert to thread
      const deleteMessage = t.proposalDeleteAlert();
      // remove all reacts
      removeReacts(messageObj);
      await messageObj.thread?.send({ content: deleteMessage });
    } catch (e) {
      const channel = this.getAlertChannel() as unknown as ForumChannel;
      const post = await channel.threads.fetch(getLastSlash(proposal.discussionThreadURL)) as ThreadChannel;
      const messageObj = await post.fetchStarterMessage();
      await post.edit({ name: `[DELETED] ${limitLength(proposal.title)}` });
      await messageObj?.edit({
        embeds: [t.deletedDiscussionMessage(proposal)],
        components: []
      });
      await post.send({ content: t.proposalDeleteAlert() });
    }
  }

  async sendProposalActionPoll(proposal: Proposal) {
    const thread = await this.getAlertChannel().threads.fetch(getLastSlash(proposal.discussionThreadURL));
    if (!thread) throw Error("Thread not found");
    const message = t.proposalActionPoll(proposal, this.config.proposalIdPrefix);
    const pollId = await thread.send({ embeds: [message] });
    // add reacts
    await Promise.all([
      pollId.react(EMOJI.YES),
      pollId.react(EMOJI.NO),
    ]);
    return pollId.url;
  }
}
