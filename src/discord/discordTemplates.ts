import {
  Message, MessageEmbed, ThreadChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dateToUnixTimeStamp } from '../utils';
import { PollResults, PollEmojis, Proposal } from '../types';

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

export const temperatureCheckRollUpMessage = (proposals: Proposal[], endDate: Date) => {
  return new MessageEmbed().setTitle(
    `Temperature checks are open until <t:${dateToUnixTimeStamp(endDate)}>`
  ).setDescription(`${String(proposals.length)} proposals`).addFields(
    proposals.map((proposal: Proposal) => {
      return {
        name: `*${proposal.proposalId}*: ${proposal.title}`,
        value: stripIndents`
        [proposal](${proposal.url}) | [discussion](${proposal.discussionThreadURL})
        ------------------------------`,
      };
    })
  );
};

export const voteRollUpMessage = (voteURL: string, proposals: Proposal[], endDate: Date) => {
  return new MessageEmbed().setTitle(
    `Voting is open until <t:${dateToUnixTimeStamp(endDate)}>`
  ).setURL(voteURL).setDescription(`${String(proposals.length)} proposals`)
    .addFields(
      proposals.map((proposal: Proposal) => {
        return {
          name: `*${proposal.proposalId}*: ${proposal.title}`,
          value: stripIndents`
          [proposal](${proposal.url}) | [discussion](${proposal.discussionThreadURL}) | [vote](${proposal.voteURL})
          ------------------------------`,
        };
      })
    );
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
