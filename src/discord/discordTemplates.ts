import {
  Message, MessageEmbed, ThreadChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dateToUnixTimeStamp } from '../utils';
import { PollResults, PollEmojis, Proposal } from '../types';

export const startDiscussionMessage = (category: string | undefined, URL: string) => {
  const messageTitle = (category) ? `New **${category}** proposal` : 'New proposal';
  return `${messageTitle}: ${URL}`;
};

export const setupPollMessage = (messageObj: Message) => {
  const additionalText = 'Temperature Check poll is now open! **Vote by reacting to this message.**';
  // in the event we have to run this twice, don't add additionalText again
  if (messageObj.content.includes(additionalText)) {
    return messageObj.content;
  }
  return stripIndents`
    ${messageObj.content}\n
    Temperature Check poll is now open! **Vote by reacting to this message.**
  `;
};

export const temperatureCheckRollUpMessage = (proposals: Proposal[], endDate: Date) => {
  const urlListText = Object.values(proposals).map((entry: Proposal, index) => {
    return `${index + 1}. ${entry.title}: ${entry.discussionThreadURL}`;
  }).join('\n\n');
  return new MessageEmbed().setTitle(
    'Temperature Checks'
  ).setDescription(
    stripIndents`
      React in the temperature checks before <t:${dateToUnixTimeStamp(endDate)}>\n
      ${urlListText}
    `
  );
};

export const voteRollUpMessage = (voteURL: string, voteProposals: Proposal[], endTime: Date) => {
  return new MessageEmbed().setTitle(
    `Voting is open until <t:${dateToUnixTimeStamp(endTime)}>`
  ).setURL(voteURL).setDescription(stripIndents`
  ${voteProposals.map((proposal: Proposal) => {
    return `${proposal.proposalId} - ${proposal.title}
    [vote](${proposal.voteURL}) | [discussion](${proposal.discussionThreadURL})`;
  }).join('\n\n')}
  `);
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
