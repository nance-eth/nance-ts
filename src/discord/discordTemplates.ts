import {
  Message, ThreadChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dateToUnixTimeStamp } from '../utils';

export const startDiscussionMessage = (category: string, URL: string) => {
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
    ${messageObj.content}\n\n
    Temperature Check poll is now open! **Vote by reacting to this message.**
  `;
};

export const temperatureCheckRollUpMessage = (proposals: any, endTime: Date) => {
  console.log(proposals);
  const urlListText = Object.values(proposals).map((entry:any, index) => {
    return `${index + 1}. ${entry.title}: ${entry.url}`;
  }).join('\n\n');
  console.log(urlListText);
  return stripIndents`
    React in the temperature checks before <t:${dateToUnixTimeStamp(endTime)}>\n
    ${urlListText}
  `;
};

export const threadToURL = (thread: ThreadChannel) => {
  return `https://discord.com/channels/${thread.guildId}/${thread.parentId}/${thread.id}`;
};
