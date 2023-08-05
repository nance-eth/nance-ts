/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
/* eslint-disable newline-per-chained-call */
import {
  MessageAttachment, MessageEmbed, ThreadChannel, EmbedFieldData, EmbedField
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { DEFAULT_DASHBOARD, dateToUnixTimeStamp, limitLength, numToPrettyString } from '../utils';
import { PollResults, PollEmojis, Proposal, DayHourMinutes } from '../types';
import { SQLPayout, SQLProposal } from '../dolt/schema';
import { getENS } from '../api/helpers/ens';

export const getProposalURL = (space: string, proposal: Proposal) => {
  return `https://nance.app/s/${space}/${proposal.proposalId || proposal.hash}`;
};

export const startDiscussionMessage = (proposalIdPrefix: string, proposal: Proposal, authorENS: string) => {
  return new MessageEmbed().setTitle(`📃 ${proposalIdPrefix}${proposal.proposalId}: ${proposal.title}`).setURL(proposal.url).addFields([
    { name: 'author', value: `[${authorENS}](${DEFAULT_DASHBOARD}/u/${authorENS})`, inline: true },
  ]);
};

export const archiveDiscussionMessage = (proposal: Proposal) => {
  return new MessageEmbed().setTitle(`[ARCHIVED] ${proposal.title}`);
};

export const temperatureCheckRollUpMessage = (proposalIdPrefix: string, proposals: Proposal[], space: string, endDate: Date) => {
  return new MessageEmbed().setColor('#c1272d').setTitle(
    `Temperature checks are open until <t:${dateToUnixTimeStamp(endDate)}>`
  ).setDescription(`${String(proposals.length)} proposals`).addFields(
    proposals.map((proposal: Proposal) => {
      proposal.url = getProposalURL(space, proposal);
      const proposalLinks = (proposal.translationURL)
        ? `[proposal](${proposal.url}) [(zh)](${proposal.translationURL})`
        : `[proposal](${proposal.url})`;
      return {
        name: `*${proposalIdPrefix}${proposal.proposalId}*: ${proposal.title}`,
        value: stripIndents`
        ${proposalLinks} | [discussion](${proposal.discussionThreadURL})
        ------------------------------`,
      };
    })
  );
};

export const voteRollUpMessage = (voteURL: string, proposalIdPrefix: string, proposals: Proposal[], space: string, endDate: Date) => {
  return new MessageEmbed().setColor('#009460').setTitle(
    `Voting is open until <t:${dateToUnixTimeStamp(endDate)}>`
  ).setURL(voteURL).setDescription(`${String(proposals.length)} proposals`)
    .addFields(
      proposals.map((proposal: Proposal) => {
        proposal.url = getProposalURL(space, proposal);
        return {
          name: `*${proposalIdPrefix}${proposal.proposalId}*: ${proposal.title}`,
          value: stripIndents`
          [discussion](${proposal.discussionThreadURL}) | [vote](${proposal.url})
          ------------------------------`,
        };
      })
    );
};

export const voteResultsRollUpMessage = (url: string, space: string, proposalIdPrefix: string, proposals: Proposal[]) => {
  return new MessageEmbed().setColor('#2772af').setTitle(
    'Voting has ended. Thanks for participating!'
  ).setURL(url).setDescription(`${String(proposals.length)} proposals`)
    .addFields(
      proposals.map((proposal: Proposal) => {
        if (proposal.internalVoteResults?.scores) {
          const [[yesWord, yesVal], [noWord, noVal]] = Object.entries(
            proposal.internalVoteResults?.scores ?? {}
          );
          const proposalURL = getProposalURL(space, proposal);
          return {
            name: `*${proposalIdPrefix}${proposal.proposalId}*: ${proposal.title}`,
            value: stripIndents`
            [${proposal.internalVoteResults?.outcomeEmoji} ${proposal.internalVoteResults?.outcomePercentage}% | ${proposal.internalVoteResults?.totalVotes} votes | ${numToPrettyString(yesVal)} ${yesWord} | ${numToPrettyString(noVal)} ${noWord}](${proposalURL})
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

export const dailyImageReminder = (space: string, day: string, governanceCycle: string, type: string, contentLink: string, processLink: string) => {
  const baseDir = `./src/tmp/${space}`;
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

export const dailyTextReminder = (governanceCycle: string, day: string, timeLeft: DayHourMinutes, endSeconds?: number, contentLink?: string) => {
  const message = new MessageEmbed().setTitle('Governance Status').setDescription(
    stripIndents`
    Today is day ${day} of GC#${governanceCycle} (ends <t:${endSeconds}:f>)\n
    There are ${timeLeft.days} days, ${timeLeft.hours} hours, and ${timeLeft.minutes} minutes left to submit a [proposal](${contentLink})\n`
  );
  return { message, attachments: [] };
};

export const payoutsTable = (payouts: SQLPayout[], governanceCycle: string, proposalLinkPrefix: string, proposalIdPrefix: string) => {
  const message = new MessageEmbed().setTitle(`Payouts for GC#${governanceCycle}`).setDescription('[submit new proposal](https://jbdao.org/edit)');
  const toAlert: string[] = [];
  payouts.forEach((payout) => {
    const payoutNum = Number(governanceCycle) - payout.governanceCycleStart + 1;
    if (payoutNum === payout.numberOfPayouts && payout.numberOfPayouts !== 1) { toAlert.push(`<@${payout.authorDiscordId ?? ''}>`); }
    message.addFields({ name: payout.payName ?? '', value: `| - - - $${payout.amount.toLocaleString()}  - - - | - - -  ${payoutNum}/${payout.numberOfPayouts} - - - | - - - [${proposalIdPrefix}${payout.proposalId}](${proposalLinkPrefix}/p/${payout.proposalId}) - - - |\n=============================================` });
  });
  return { message, toAlert: toAlert.join(' ') };
};

export const transactionThread = (nonce: number, operation: string, links: EmbedFieldData[]) => {
  const description = links.map((link) => {
    return `[${link.name}](${link.value})`;
  }).join('\n');
  const message = new MessageEmbed().setTitle(`Tx ${nonce}: ${operation}`).setDescription(description);
  return message;
};

export const transactionSummary = (proposalIdPrefix: string, addPayouts?: SQLPayout[], removePayouts?: SQLPayout[], oldDistributionLimit?: number, newDistributionLimit?: number, otherProposals?: SQLProposal[]) => {
  const message = new MessageEmbed().setTitle('Summary');
  if (addPayouts) {
    const additions = addPayouts.map((payout) => {
      // return `* [${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId}) --> **+$${payout.amount.toLocaleString()}** ${payout.payName} \`(${payout.payAddress || payout.payProject})\``;
      // return `* [${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId}) +$${payout.amount.toLocaleString()} ${payout.payName}`;
      return [
        { name: '-------', value: `[${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId})`, inline: true },
        { name: '-------', value: `+$${payout.amount.toLocaleString()}`, inline: true },
        { name: '-------', value: `${payout.payName} (${payout.payAddress || payout.payProject})`, inline: true }
      ];
    }).flatMap((a) => { return a; }) as unknown as EmbedFieldData[];
    message.addFields(
      { name: 'ADD', value: '=============' },
      { name: 'Proposal ID', value: '\u200b', inline: true },
      { name: 'Amount', value: '\u200b', inline: true },
      { name: 'Receipient', value: '\u200b', inline: true },
      ...additions
    ).setTitle('\u200b');
  }
  if (removePayouts) {
    const removals = removePayouts.map((payout) => {
      // return `* [${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId}) --> **+$${payout.amount.toLocaleString()}** ${payout.payName} \`(${payout.payAddress || payout.payProject})\``;
      // return `* [${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId}) +$${payout.amount.toLocaleString()} ${payout.payName}`;
      return [
        { name: '-------', value: `[${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId})`, inline: true },
        { name: '-------', value: `-$${payout.amount.toLocaleString()}`, inline: true },
        { name: '-------', value: `${payout.payName} (${payout.payAddress || payout.payProject})`, inline: true }
      ];
    }).flatMap((a) => { return a; }) as unknown as EmbedFieldData[];
    message.addFields(
      { name: 'REMOVE', value: '=============' },
      { name: 'Proposal ID', value: '\u200b', inline: true },
      { name: 'Amount', value: '\u200b', inline: true },
      { name: 'Receipient', value: '\u200b', inline: true },
      ...removals
    ).setTitle('\u200b');
  }
  if (oldDistributionLimit && newDistributionLimit) {
    message.addFields(
      { name: 'OLD DISTRIBUTION LIMIT', value: `$${oldDistributionLimit.toLocaleString()}`, inline: true },
      { name: 'NEW DISTRIBUTION LIMIT', value: `$${newDistributionLimit.toLocaleString()}`, inline: true }
    );
  }
  if (otherProposals) {
    const value = otherProposals.map((proposal) => {
      return `* [${proposalIdPrefix}${proposal.proposalId}](https://jbdao.org/snapshot/${proposal.snapshotId})`;
    }).join('\n');
    message.addFields({ name: 'OTHER PASSED PROPOSALS', value });
  }
  return message;
};

export const proposalDiff = (space: string, diffText: string, hash: string) => {
  const message = `Proposal edited\n\`\`\`diff\n${limitLength(diffText, 1900)}\`\`\`\nhttps://jbdao.org/s/${space}/${hash}`;
  return message;
};

export const proposalArchiveAlert = () => {
  const message = '🚫 This proposal has been archived by the author. It will no longer be carried through the proposal process 🚫';
  return message;
};

export const proposalUnarchiveAlert = () => {
  const message = '✅ This proposal has been unarchived by the author. It will be carried through the regular proposal process ✅';
  return message;
};
