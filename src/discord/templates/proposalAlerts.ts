import { getActionsFromBody, PollEmojis, PollResults, Proposal } from "@nance/nance-sdk";
import { EmbedBuilder } from "discord.js";
import { stripIndents } from "common-tags";
import { getProposalURL } from "../helpers";
import { dateToUnixTimeStamp, maybePlural, numToPrettyString } from "@/utils";
import { actionsToMarkdown } from "@/tasks/voteSetup";
import { DEFAULT_DASHBOARD, EMOJI } from "@/constants";

export const startDiscussionMessage = async (
  space: string,
  proposalIdPrefix: string,
  proposal: Proposal,
  authorENS: string,
  customDomain?: string,
) => {
  const proposalAuthor = proposal.authorAddress ?
    `[${authorENS}](${DEFAULT_DASHBOARD}/u/${authorENS})` :
    "Sponsor Required!";
  const m = new EmbedBuilder().setTitle(`${proposalIdPrefix}${proposal.proposalId}: ${proposal.title}`)
    .setURL(getProposalURL(space, proposal, customDomain))
    // "author" field of Discord message is a nice way to display Governance Cycle
    .setAuthor({ name: `📃 GC#${proposal.governanceCycle}`, url: `${DEFAULT_DASHBOARD}/s/${space}?cycle=${proposal.governanceCycle}` })
    .addFields([
      { name: "author", value: proposalAuthor, inline: true },
    ]);
  if (proposal.authorDiscordId) {
    m.addFields({ name: "discord user", value: `<@${proposal.authorDiscordId}>`, inline: true });
  }
  const actions = getActionsFromBody(proposal.body);
  const actionsMd = actions ? await actionsToMarkdown(actions) : "NONE";
  m.setDescription(`**actions**\n${actionsMd}`);
  return m;
};

export const pollResultsMessage = (
  pollResults: PollResults,
  outcome: boolean,
  pollEmojis: PollEmojis
) => {
  const unverifiedMessage = (pollResults.unverifiedUsers.length > 0) ? `There are ${pollResults.unverifiedUsers.length} unverified users (not counted in poll):\n${pollResults.unverifiedUsers.join(", ")}` : "";
  return new EmbedBuilder().setTitle(
    `Temperature Check ${(outcome) ? pollEmojis.voteYesEmoji : pollEmojis.voteNoEmoji}`
  ).setDescription(
    stripIndents`
      Results\n========\n
      ${pollResults.voteYesUsers.length} ${pollEmojis.voteYesEmoji}\n
      ${pollResults.voteYesUsers.join("\n")}\n

      ${pollResults.voteNoUsers.length} ${pollEmojis.voteNoEmoji}\n
      ${pollResults.voteNoUsers.join("\n")}\n
      ${unverifiedMessage}
    `
  );
};

export const blindPollMessage = ({ yes, no }: { yes: number, no: number }, pass?: boolean) => {
  const message = new EmbedBuilder().setTitle("Temperature Check")
    .setDescription(`Last updated\n<t:${Math.floor(Date.now() / 1000)}>`)
    .addFields([
      { name: EMOJI.YES, value: `${yes}`, inline: true },
      { name: EMOJI.NO, value: `${no}`, inline: true },
    ])
    .setColor("#FF0000");
  if (pass !== undefined) {
    const outcome = pass ? EMOJI.YES : EMOJI.NO;
    const results = pass ? `${yes}/${yes + no}` : `${no}/${yes + no}`;
    message
      .setDescription(`Poll closed\n<t:${Math.floor(Date.now() / 1000)}>`)
      .addFields([
        { name: "Outcome", value: `${results} ${outcome}` }
      ]);
  }
  return message;
};

export const archiveDiscussionMessage = (proposal: Proposal) => {
  return new EmbedBuilder().setTitle(`[ARCHIVED] ${proposal.title}`);
};

export const deletedDiscussionMessage = (proposal: Proposal) => {
  return new EmbedBuilder().setTitle(`[DELETED] ${proposal.title}`);
};

export const reminderEndMessage = (thingToRemind: string, endDate: Date) => {
  return new EmbedBuilder().setColor("#F19800").setTitle(
    `${thingToRemind} ending <t:${dateToUnixTimeStamp(endDate)}:R>!`
  );
};

export const reminderStartMessage = (thingToRemind: string, startDate: Date) => {
  return new EmbedBuilder().setColor("#F19800").setTitle(
    `${thingToRemind} starting <t:${dateToUnixTimeStamp(startDate)}:R>!`
  );
};

export const proposalArchiveAlert = () => {
  const message = "🚫 This proposal has been archived by the author. It will no longer be carried through the proposal process 🚫";
  return message;
};

export const proposalUnarchiveAlert = () => {
  const message = "✅ This proposal has been unarchived by the author. It will be carried through the regular proposal process ✅";
  return message;
};

export const proposalDeleteAlert = () => {
  const message = "🗑️ This proposal has been deleted by the author. It has been permanently removed from the Nance database 🗑️";
  return message;
};

export const proposalDiff = (
  space: string,
  proposal: Proposal,
  customDomain?: string
) => {
  const message = `🎶 edit <${getProposalURL(space, proposal, customDomain)}>`;
  return message;
};

export const proposalsUnderQuorumMessage = (voteURL: string, proposalIdPrefix: string, proposals: Proposal[], quorum: number, space: string) => {
  return new EmbedBuilder()
    .setColor("#d48c11")
    .setTitle("Proposals under quorum")
    .setURL(voteURL)
    .setDescription(`There are ${String(proposals.length)} ${maybePlural("proposal", proposals.length)} under the set quorum of **${numToPrettyString(quorum, 0)}**`)
    .addFields(
      proposals.map((proposal: Proposal) => {
        const { scoresTotal } = proposal.voteResults || {};
        const [yesWord, noWord] = (proposal.voteResults?.choices) || ["For", "Against"];
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
