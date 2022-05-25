import {
  Message, MessageEmbed, ThreadChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dateToUnixTimeStamp } from '../utils';
import { PollResults, PollEmojis } from '../types';

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

export const temperatureCheckRollUpMessage = (proposals: any, endTime: Date) => {
  const urlListText = Object.values(proposals).map((entry:any, index) => {
    return `${index + 1}. ${entry.title}: ${entry.discussionThreadURL}`;
  }).join('\n\n');
  return stripIndents`
    React in the temperature checks before <t:${dateToUnixTimeStamp(endTime)}>\n
    ${urlListText}
  `;
};

export const pollResultsMessage = (pollResults: PollResults, pollEmojis: PollEmojis) => {
  return new MessageEmbed().setDescription(
    stripIndents`
      Results\n========\n
      ${pollResults.voteYesUsers.length} ${pollEmojis.voteYesEmoji}\n
      ${pollResults.voteYesUsers.join('\n')}\n\n

      ${pollResults.voteNoUsers.length} ${pollEmojis.voteNoEmoji}\n
      ${pollResults.voteNoUsers.join('\n')}\n\n
    `
  );
};

export const threadToURL = (thread: ThreadChannel) => {
  return `https://discord.com/channels/${thread.guildId}/${thread.parentId}/${thread.id}`;
};
