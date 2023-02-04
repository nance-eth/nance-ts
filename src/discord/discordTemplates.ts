/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
/* eslint-disable newline-per-chained-call */
import {
  MessageAttachment, MessageEmbed, ThreadChannel,
} from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';
import { dateToUnixTimeStamp, numToPrettyString } from '../utils';
import { PollResults, PollEmojis, Proposal } from '../types';
import { SQLPayout } from '../dolt/schema';

export const juiceToolUrl = (proposal: Proposal, space: string) => {
  return `https://jbdao.org/proposal/${proposal.hash}`;
};

export const startDiscussionMessage = (proposal: Proposal) => {
  return new MessageEmbed().setTitle(`📃 ${proposal.title}`).setURL(proposal.url);
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

export const dailyImageReminder = (day: string, governanceCycle: string, type: string, contentLink: string, processLink: string) => {
  const baseDir = './src/tmp';
  const thumbnail = new MessageAttachment(`${baseDir}/day${day}/thumbnail.png`, 'thumbnail.png');
  const image = new MessageAttachment(`${baseDir}/day${day}/${day}.png`, 'image.png');
  const preamble = () => {
    if (type === 'delay') { return 'Submit a proposal'; }
    if (type === 'execution') { return 'Multisig members assemble and configure the next funding cycle'; }
    if (type === 'temperature check') { return 'Take part in the temperature checks'; }
    if (type === 'vote') { return 'Take part in the voting'; }
    return undefined;
  };
  const message = new MessageEmbed().setTitle('Governance Status').setDescription(
    stripIndents`
    Today is day ${Number(day)} of GC#${governanceCycle}\n
    ${preamble()} [here](${contentLink})!\n
    Read about our governance process [here](${processLink})`
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

export const payoutsTable = (payouts: SQLPayout[], governanceCycle: string, proposalLinkPrefix: string, proposalIdPrefix: string) => {
  const message = new MessageEmbed().setTitle(`Payouts for GC#${governanceCycle}`).setDescription('[submit new proposal](https://juicetool.xyz/nance/juicebox/new)');
  const toAlert: string[] = [];
  payouts.forEach((payout) => {
    const payoutNum = Number(governanceCycle) - payout.governanceCycleStart + 1;
    if (payoutNum === payout.numberOfPayouts && payout.numberOfPayouts !== 1) { toAlert.push(`<@${payout.authorDiscordId ?? ''}>`); }
    message.addFields({ name: payout.payName ?? '', value: `| - - - $${payout.amount.toLocaleString()}  - - - | - - -  ${payoutNum}/${payout.numberOfPayouts} - - - | - - - [${proposalIdPrefix}${payout.proposalId}](${proposalLinkPrefix}/proposal/${payout.snapshotId}) - - - |\n=============================================` });
  });
  return { message, toAlert: toAlert.join(' ') };
};

export const transactionThread = (nonce: number, operation: string, oldDistributionLimit: number, newDistributionLimit: number, simulationURL: string) => {
  const message = new MessageEmbed().setTitle(`Tx ${nonce}: ${operation}`).setDescription(oneLine`
    [Tenderly simulation](${simulationURL})\n
    [Transaction Diff](https://www.jbdao.org/juicebox)\n
  `);
  return message;
};
