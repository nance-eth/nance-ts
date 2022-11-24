/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
/* eslint-disable newline-per-chained-call */
import {
  Message, MessageAttachment, MessageEmbed, ThreadChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dateToUnixTimeStamp, numToPrettyString } from '../utils';
import { PollResults, PollEmojis, Proposal } from '../types';

export const juiceToolUrl = (proposal: Proposal, space: string) => {
  return `https://juicetool.xyz/nance/${space}/proposal/${proposal.hash}`;
};

export const startDiscussionMessage = (proposal: Proposal) => {
  return new MessageEmbed().setTitle(`📃 ${proposal.title}`).setURL(proposal.url);
};

export const setupPollMessage = (messageObj: Message) => {
  const additionalText = 'Temperature Check poll is now open!';
  // in the event we have to run this twice, don't add additionalText again
  if (messageObj.content.includes(additionalText)) {
    return messageObj.content;
  }
  return stripIndents`
    ${messageObj.content}\n
    ${additionalText}
  `;
};

export const temperatureCheckRollUpMessage = (proposals: Proposal[], space: string, endDate: Date) => {
  return new MessageEmbed().setColor('#c1272d').setTitle(
    `Temperature checks are open until <t:${dateToUnixTimeStamp(endDate)}>`
  ).setDescription(`${String(proposals.length)} proposals`).addFields(
    proposals.map((proposal: Proposal) => {
      proposal.url = juiceToolUrl(proposal, space);
      const proposalLinks = (proposal.translationURL)
        ? `[proposal](${proposal.url}) [(zh)](${proposal.translationURL})`
        : `[proposal](${proposal.url})`;
      return {
        name: `*${proposal.proposalId}*: ${proposal.title}`,
        value: stripIndents`
        ${proposalLinks} | [discussion](${proposal.discussionThreadURL})
        ------------------------------`,
      };
    })
  );
};

export const voteRollUpMessage = (voteURL: string, proposals: Proposal[], space: string, endDate: Date) => {
  return new MessageEmbed().setColor('#009460').setTitle(
    `Voting is open until <t:${dateToUnixTimeStamp(endDate)}>`
  ).setURL(voteURL).setDescription(`${String(proposals.length)} proposals`)
    .addFields(
      proposals.map((proposal: Proposal) => {
        proposal.url = juiceToolUrl(proposal, space);
        const proposalLinks = (proposal.translationURL)
          ? `[proposal](${proposal.url}) [(zh)](${proposal.translationURL})`
          : `[proposal](${proposal.url})`;
        return {
          name: `*${proposal.proposalId}*: ${proposal.title}`,
          value: stripIndents`
          ${proposalLinks} | [discussion](${proposal.discussionThreadURL}) | [vote](${proposal.voteURL})
          ------------------------------`,
        };
      })
    );
};

export const voteResultsRollUpMessage = (url: string, proposals: Proposal[]) => {
  return new MessageEmbed().setColor('#2772af').setTitle(
    'Voting has ended. Thanks for participating!'
  ).setURL(url).setDescription(`${String(proposals.length)} proposals`)
    .addFields(
      proposals.map((proposal: Proposal) => {
        if (proposal.voteResults?.scores) {
          const [[yesWord, yesVal], [noWord, noVal]] = Object.entries(
            proposal.voteResults?.scores ?? {}
          );
          return {
            name: `*${proposal.proposalId}*: ${proposal.title}`,
            value: stripIndents`
            [${proposal.voteResults?.outcomeEmoji} ${proposal.voteResults?.outcomePercentage}% | ${proposal.voteResults?.totalVotes} votes | ${numToPrettyString(yesVal)} ${yesWord} | ${numToPrettyString(noVal)} ${noWord}](${proposal.voteURL})
            ------------------------------`,
          };
        }
        return {
          name: `*${proposal.proposalId}*: ${proposal.title}`,
          value: 'ERROR: issue fetching vote results'
        };
      })
    );
};

export const reminderEndMessage = (thingToRemind: string, endDate: Date, url = '') => {
  return new MessageEmbed().setColor('#F19800').setTitle(
    `${thingToRemind} ending <t:${dateToUnixTimeStamp(endDate)}:R>!`
  ).setDescription(url);
};

export const reminderStartMessage = (thingToRemind: string, startDate: Date, url = '') => {
  return new MessageEmbed().setColor('#F19800').setTitle(
    `${thingToRemind} starting <t:${dateToUnixTimeStamp(startDate)}:R>!`
  ).setDescription(url);
};

export const pollResultsMessage = (
  pollResults: PollResults,
  outcome: boolean,
  pollEmojis: PollEmojis
) => {
  return new MessageEmbed().setTitle(
    `Temperature Check ${(outcome) ? pollEmojis.voteYesEmoji : pollEmojis.voteNoEmoji}`
  ).setDescription(
    stripIndents`
      Results\n========\n
      ${pollResults.voteYesUsers.length} ${pollEmojis.voteYesEmoji}\n
      ${pollResults.voteYesUsers.join('\n')}\n

      ${pollResults.voteNoUsers.length} ${pollEmojis.voteNoEmoji}\n
      ${pollResults.voteNoUsers.join('\n')}\n
    `
  );
};

export const threadToURL = (thread: ThreadChannel) => {
  return `https://discord.com/channels/${thread.guildId}/${thread.parentId}/${thread.id}`;
};

export const dailyImageReminder = (day: string, governanceCycle: string, type: string) => {
  const baseDir = './src/tmp';
  const thumbnail = new MessageAttachment(`${baseDir}/day${day}/thumbnail.png`, 'thumbnail.png');
  const image = new MessageAttachment(`${baseDir}/day${day}/${day}.png`, 'image.png');
  const message = new MessageEmbed().setTitle('Governance Status').setDescription(
    `Today is day ${Number(day)} of GC#${governanceCycle}`
  ).setThumbnail(
    'attachment://thumbnail.png'
  ).setImage(
    'attachment://image.png'
  );
  return {
    message,
    attachments: [thumbnail, image]
  };
};
