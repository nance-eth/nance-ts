/* eslint-disable max-lines */
/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
/* eslint-disable newline-per-chained-call */
import {
  AttachmentBuilder, EmbedBuilder, ThreadChannel, EmbedField
} from 'discord.js';
import { oneLine, stripIndents } from 'common-tags';
import { PollResults, PollEmojis, Proposal, SQLPayout, SQLProposal, getActionsFromBody } from '@nance/nance-sdk';
import { DEFAULT_DASHBOARD, dateToUnixTimeStamp, getReminderImages, maybePlural, numToPrettyString } from '../utils';
import { EMOJI } from '../constants';
import { DiffLines } from "../api/helpers/diff";
import { actionsToMarkdown } from "../tasks/voteSetup";

export const getProposalURL = (space: string, proposal: Proposal) => {
  return `${DEFAULT_DASHBOARD}/s/${space}/${proposal.proposalId || proposal.uuid}`;
};

const simpleProposalList = (proposals: Proposal[], space: string, proposalIdPrefix: string) => {
  const list = proposals.map((proposal, i) => {
    let emoji = '';
    if (proposal.status === 'Temperature Check') { emoji = EMOJI.TEMPERATURE_CHECK; }
    if (proposal.status === 'Voting') { emoji = EMOJI.VOTE; }
    if (proposal.status === 'Discussion') { emoji = EMOJI.DISCUSSION; }
    if (proposal.status === 'Approved') { emoji = EMOJI.APPROVED; }
    if (proposal.status === 'Cancelled') { emoji = EMOJI.CANCELLED; }
    return `${emoji}\u00a0[${proposalIdPrefix}${proposal.proposalId}: ${proposal.title}](${getProposalURL(space, proposal)})`;
  }).join('\n');
  if (list === '') { return 'None'; }
  return list;
};

export const startDiscussionMessage = async (space: string, proposalIdPrefix: string, proposal: Proposal, authorENS: string) => {
  const m = new EmbedBuilder().setTitle(`${proposalIdPrefix}${proposal.proposalId}: ${proposal.title}`)
    .setURL(getProposalURL(space, proposal))
    .setAuthor({ name: `📃 GC#${proposal.governanceCycle}`, url: `${DEFAULT_DASHBOARD}/s/${space}?cycle=${proposal.governanceCycle}` })
    .addFields([
      { name: 'author', value: `[${authorENS}](${DEFAULT_DASHBOARD}/u/${authorENS})`, inline: true },
    ]);
  if (proposal.authorDiscordId) {
    m.addFields({ name: 'discord user', value: `<@${proposal.authorDiscordId}>`, inline: true });
  }
  const actions = getActionsFromBody(proposal.body);
  const actionsMd = actions ? await actionsToMarkdown(actions) : '';
  m.addFields({ name: 'actions', value: actionsMd || "NONE", inline: false });
  return m;
};

export const archiveDiscussionMessage = (proposal: Proposal) => {
  return new EmbedBuilder().setTitle(`[ARCHIVED] ${proposal.title}`);
};

export const deletedDiscussionMessage = (proposal: Proposal) => {
  return new EmbedBuilder().setTitle(`[DELETED] ${proposal.title}`);
};

export const temperatureCheckRollUpMessage = (proposalIdPrefix: string, proposals: Proposal[], space: string, endDate: Date) => {
  return new EmbedBuilder().setColor('#c1272d').setTitle(
    `Temperature checks are open until <t:${dateToUnixTimeStamp(endDate)}>`)
    .setDescription(`${String(proposals.length)} proposals`)
    .setAuthor({ name: `📃 GC#${proposals[0].governanceCycle}`, url: `${DEFAULT_DASHBOARD}/s/${space}?cycle=${proposals[0].governanceCycle}` })
    .addFields(
      proposals.map((proposal: Proposal) => {
        return {
          name: `*${proposalIdPrefix}${proposal.proposalId}*: ${proposal.title}`,
          value: stripIndents`
        [proposal](${getProposalURL(space, proposal)}) | [discussion](${proposal.discussionThreadURL})
        -----------------------------------------`,
        };
      })
    );
};

export const voteRollUpMessage = (voteURL: string, proposalIdPrefix: string, proposals: Proposal[], space: string, endDate: Date) => {
  return new EmbedBuilder().setColor('#009460').setTitle(
    `Voting is open until <t:${dateToUnixTimeStamp(endDate)}>`
  ).setURL(voteURL).setDescription(`${String(proposals.length)} proposals`)
    .setAuthor({ name: `📃 GC#${proposals[0].governanceCycle}`, url: `${DEFAULT_DASHBOARD}/s/${space}?cycle=${proposals[0].governanceCycle}` })
    .addFields(
      proposals.map((proposal: Proposal) => {
        return {
          name: `*${proposalIdPrefix}${proposal.proposalId}*: ${proposal.title}`,
          value: stripIndents`
          [discussion](${proposal.discussionThreadURL}) | [vote](${getProposalURL(space, proposal)})
          -----------------------------------------`,
        };
      })
    );
};

export const proposalsUnderQuorumMessage = (voteURL: string, proposalIdPrefix: string, proposals: Proposal[], quorum: number, space: string) => {
  return new EmbedBuilder().setColor('#d48c11').setTitle('Proposals under quorum').setURL(voteURL).setDescription(
    `There are ${String(proposals.length)} ${maybePlural('proposal', proposals.length)} under the set quorum of **${numToPrettyString(quorum, 0)}**`)
    .addFields(
      proposals.map((proposal: Proposal) => {
        const { scoresTotal } = proposal.voteResults || {};
        const [yesWord, noWord] = (proposal.voteResults?.choices) || ['For', 'Against'];
        const [yesVal, noVal] = (proposal.voteResults?.scores) || [0, 0];
        const proposalURL = getProposalURL(space, proposal);
        return {
          name: `*${proposalIdPrefix}${proposal.proposalId}*: ${proposal.title}`,
          value: stripIndents`
          [${numToPrettyString(scoresTotal)} votes | ${numToPrettyString(yesVal)} ${yesWord} | ${numToPrettyString(noVal)} ${noWord}](${proposalURL})
          under quorum by **${numToPrettyString(quorum - (scoresTotal || 0), 0)}**
          -----------------------------------------`,
        };
      })
    );
};

export const voteResultsRollUpMessage = (url: string, space: string, proposalIdPrefix: string, proposals: Proposal[]) => {
  return new EmbedBuilder().setColor('#2772af').setTitle(
    'Voting has ended. Thanks for participating!'
  ).setURL(url).setDescription(`${String(proposals.length)} proposals`)
    .setAuthor({ name: `📃 GC#${proposals[0].governanceCycle}`, url: `${DEFAULT_DASHBOARD}/s/${space}?cycle=${proposals[0].governanceCycle}` })
    .addFields(
      proposals.map((proposal: Proposal) => {
        if (proposal.voteResults) {
          const [yesWord, noWord] = (proposal.voteResults.choices);
          const [yesVal, noVal] = (proposal.voteResults.scores);
          const emoji = (proposal.status === "Approved") ? EMOJI.APPROVED : EMOJI.CANCELLED;
          const scoresTotal = numToPrettyString(proposal.voteResults.scoresTotal, 0);
          const proposalURL = getProposalURL(space, proposal);
          const quorumMet = (proposal.voteResults.quorumMet) ? '' : ' (quorum not met)';
          return {
            name: `*${proposalIdPrefix}${proposal.proposalId}*: ${proposal.title}`,
            value: stripIndents`
            [${emoji} ${scoresTotal} votes${quorumMet} | ${numToPrettyString(yesVal, 0)} ${yesWord} | ${numToPrettyString(noVal, 0)} ${noWord}](${proposalURL})
            -----------------------------------------`,
          };
        }
        return {
          name: `*${proposal.proposalId}*: ${proposal.title}`,
          value: `[view results](${getProposalURL(space, proposal)})`,
        };
      })
    );
};

export const reminderEndMessage = (thingToRemind: string, endDate: Date) => {
  return new EmbedBuilder().setColor('#F19800').setTitle(
    `${thingToRemind} ending <t:${dateToUnixTimeStamp(endDate)}:R>!`
  );
};

export const reminderStartMessage = (thingToRemind: string, startDate: Date) => {
  return new EmbedBuilder().setColor('#F19800').setTitle(
    `${thingToRemind} starting <t:${dateToUnixTimeStamp(startDate)}:R>!`
  );
};

export const pollResultsMessage = (
  pollResults: PollResults,
  outcome: boolean,
  pollEmojis: PollEmojis
) => {
  const unverifiedMessage = (pollResults.unverifiedUsers.length > 0) ? `There are ${pollResults.unverifiedUsers.length} unverified users (not counted in poll):\n${pollResults.unverifiedUsers.join(', ')}` : '';
  return new EmbedBuilder().setTitle(
    `Temperature Check ${(outcome) ? pollEmojis.voteYesEmoji : pollEmojis.voteNoEmoji}`
  ).setDescription(
    stripIndents`
      Results\n========\n
      ${pollResults.voteYesUsers.length} ${pollEmojis.voteYesEmoji}\n
      ${pollResults.voteYesUsers.join('\n')}\n

      ${pollResults.voteNoUsers.length} ${pollEmojis.voteNoEmoji}\n
      ${pollResults.voteNoUsers.join('\n')}\n
      ${unverifiedMessage}
    `
  );
};

export const threadToURL = (thread: ThreadChannel) => {
  return `https://discord.com/channels/${thread.guildId}/${thread.parentId}/${thread.id}`;
};

const getPreamble = (type: string) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('delay')) { return 'Submit a proposal'; }
  if (typeLower.includes('execution')) { return 'Multisig members assemble and configure the next funding cycle'; }
  if (typeLower.includes('temperature check')) { return 'Take part in the temperature checks'; }
  if (typeLower.includes('vote')) { return 'Take part in the voting'; }
  return undefined;
};

export const dailyImageReminder = async (
  day: number,
  imagesCID: string,
  governanceCycle: number,
  type: string,
  proposals: Proposal[],
  space: string,
  proposalIdPrefix: string,
  contentLink: string,
  endSeconds: number
) => {
  const { thumbnail, image } = await getReminderImages(imagesCID, day);
  const thumbnailAttachment = new AttachmentBuilder(thumbnail, { name: 'thumbnail.png' });
  const imageAttachment = new AttachmentBuilder(image, { name: 'image.png' });
  const preamble = getPreamble(type);

  const proposalsThisCycle = proposals.filter((proposal) => proposal.governanceCycle === governanceCycle);
  const proposalsNextCycle = proposals.filter((proposal) => proposal.governanceCycle === governanceCycle + 1);

  const message = new EmbedBuilder().setTitle('Governance Status').setDescription(
    stripIndents`
    Today is day ${day} of GC#${governanceCycle}\n
    ${preamble} [here](${contentLink}) by <t:${endSeconds}:f> (<t:${endSeconds}:R>)!`
  ).setThumbnail(
    'attachment://thumbnail.png'
  ).setImage(
    'attachment://image.png'
  );

  message.addFields([
    { name: 'Proposals This Cycle', value: simpleProposalList(proposalsThisCycle, space, proposalIdPrefix) },
    { name: 'Proposals Next Cycle', value: simpleProposalList(proposalsNextCycle, space, proposalIdPrefix) },
  ]);

  return {
    message,
    attachments: [thumbnailAttachment, imageAttachment]
  };
};

export const dailyJuiceboxBasedReminder = (governanceCycle: number, day: number, endSeconds: number, delaySeconds: number, contentLink?: string) => {
  const message = new EmbedBuilder().setTitle('Governance Status').setDescription(stripIndents`
    Today is day ${day} of GC#${governanceCycle}\n
    Submit a proposal [here](${contentLink})
  `).addFields(
    { name: 'Cycle Ends At', value: `<t:${endSeconds}:f> (<t:${endSeconds}:R>)` },
    { name: 'Delay Period', value: `${delaySeconds / (24 * 3600)} days` },
    { name: 'Reconfiguration Must Be Submitted By', value: `<t:${endSeconds - delaySeconds}:f> (<t:${endSeconds - delaySeconds}:R>)` },
  );
  return { message, attachments: [] };
};

export const dailyBasicReminder = (
  governanceCycle: number,
  day: number,
  type: string,
  proposals: Proposal[],
  space: string,
  proposalIdPrefix: string,
  endSeconds?: number) => {
  const proposalsThisCycle = proposals.filter((proposal) => proposal.governanceCycle === governanceCycle);
  const proposalsNextCycle = proposals.filter((proposal) => proposal.governanceCycle === governanceCycle + 1);
  const message = new EmbedBuilder().setTitle('Governance Status')
    .setDescription(`Today is day ${day} of GC#${governanceCycle}\n`)
    .addFields(
      { name: 'Current Event', value: type },
      { name: 'Ends At', value: `<t:${endSeconds}:f> (<t:${endSeconds}:R>)` },
    );
  message.addFields([
    { name: 'Proposals This Cycle', value: simpleProposalList(proposalsThisCycle, space, proposalIdPrefix) },
    { name: 'Proposals Next Cycle', value: simpleProposalList(proposalsNextCycle, space, proposalIdPrefix) },
  ]);
  return { message, attachments: [] };
};

export const payoutsTable = (payouts: SQLPayout[], governanceCycle: number, space: string, proposalIdPrefix: string) => {
  const message = new EmbedBuilder();
  const toAlert: string[] = [];
  const payoutsText: string[] = [];
  const getPayoutHeadline = (payout: SQLPayout) => {
    if (payout.payProjectHandle) { return { text: `@${payout.payProjectHandle}`, link: `https://juicebox.money/@${payout.payProjectHandle}` }; }
    if (payout.payProject) { return { text: `@${payout.payProject}`, link: `https://juicebox.money/v2/p/${payout.payProject}` }; }
    if (payout.payENS) { return { text: `${payout.payENS}`, link: `https://etherscan.com/address/${payout.payAddress}` }; }
    return { text: `${payout.payAddress?.slice(0, 5)}...${payout.payAddress?.slice(38)}`, link: `https://etherscan.com/address/${payout.payAddress}` };
  };
  const totalDistribution = payouts.reduce((acc, payout) => { return acc + payout.amount; }, 0);
  payouts.forEach((payout) => {
    const payoutNum = governanceCycle - payout.governanceCycleStart + 1;
    if (payoutNum === payout.numberOfPayouts && payout.numberOfPayouts !== 1) { toAlert.push(`<@${payout.authorDiscordId ?? ''}>`); }
    const payoutHeadline = getPayoutHeadline(payout);
    const payoutHeadlineFull = `[${payoutHeadline.text}](${payoutHeadline.link})`;
    const proposalURL = getProposalURL(space, { proposalId: payout.proposalId, uuid: payout.uuidOfProposal } as Proposal);
    payoutsText.push(`_${payoutNum}/${payout.numberOfPayouts}_ ${payoutHeadlineFull} **$${payout.amount.toLocaleString()}** [[${proposalIdPrefix}${payout.proposalId}]](${proposalURL})\n`);
  });
  message.setDescription(
    stripIndents`
    ## __Payouts for GC${governanceCycle}__
    _Total Distribution:_\n***$${totalDistribution.toLocaleString()}***\n
    ${payoutsText.join('\n')}`);
  return { message, toAlert: toAlert.join(' ') };
};

export const transactionThread = (nonce: number, operation: string, links: EmbedField[]) => {
  const description = links.map((link) => {
    return `[${link.name}](${link.value})`;
  }).join('\n');
  const message = new EmbedBuilder().setTitle(`Tx ${nonce}: ${operation}`).setDescription(description);
  return message;
};

export const transactionSummary = (proposalIdPrefix: string, addPayouts?: SQLPayout[], removePayouts?: SQLPayout[], oldDistributionLimit?: number, newDistributionLimit?: number, otherProposals?: SQLProposal[]) => {
  const message = new EmbedBuilder().setTitle('Summary');
  if (addPayouts) {
    const additions = addPayouts.map((payout) => {
      // return `* [${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId}) --> **+$${payout.amount.toLocaleString()}** ${payout.payName} \`(${payout.payAddress || payout.payProject})\``;
      // return `* [${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId}) +$${payout.amount.toLocaleString()} ${payout.payName}`;
      return [
        { name: '-------', value: `[${proposalIdPrefix}${payout.proposalId}](https://jbdao.org/snapshot/${payout.snapshotId})`, inline: true },
        { name: '-------', value: `+$${payout.amount.toLocaleString()}`, inline: true },
        { name: '-------', value: `${payout.payName} (${payout.payAddress || payout.payProject})`, inline: true }
      ];
    }).flatMap((a) => { return a; }) as unknown as EmbedField[];
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
    }).flatMap((a) => { return a; }) as unknown as EmbedField[];
    message.addFields(
      { name: 'REMOVE', value: '=============' },
      { name: 'Proposal ID', value: '\u200b', inline: true },
      { name: 'Amount', value: '\u200b', inline: true },
      { name: 'Recipient', value: '\u200b', inline: true },
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

export const proposalDiff = (space: string, proposal: Proposal, diffLineCounts: DiffLines) => {
  const { added, removed } = diffLineCounts;
  const message = `🎶 edit: ${added} ${maybePlural('line', added)} added ${removed} ${maybePlural('line', removed)} removed <${getProposalURL(space, proposal)}>`;
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

export const proposalDeleteAlert = () => {
  const message = '🗑️ This proposal has been deleted by the author. It has been permanently removed from the Nance database 🗑️';
  return message;
};

export const blindPollMessage = ({ yes, no }: { yes: number, no: number }) => {
  return new EmbedBuilder().setTitle('Temperature Check')
    .setDescription(`Last updated\n<t:${Math.floor(Date.now() / 1000)}>`)
    .addFields([
      { name: EMOJI.YES, value: `${yes}`, inline: true },
      { name: EMOJI.NO, value: `${no}`, inline: true },
    ])
    .setColor('#FF0000');
};
