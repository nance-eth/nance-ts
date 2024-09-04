import { stripIndents } from "common-tags";
import { EmbedBuilder } from "discord.js";
import { Proposal } from "@nance/nance-sdk";
import { dateToUnixTimeStamp, numToPrettyString } from "@/utils";
import { DEFAULT_DASHBOARD } from "@/constants";
import { getProposalURL } from "../helpers";

export const temperatureCheckRollUpMessage = (proposalIdPrefix: string, proposals: Proposal[], space: string, endDate: Date) => {
  return new EmbedBuilder().setColor("#c1272d").setTitle(
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
  return new EmbedBuilder().setColor("#009460").setTitle(
    `Voting is open until <t:${dateToUnixTimeStamp(endDate)}>`
  ).setURL(voteURL)
    .setDescription(`${String(proposals.length)} proposals`)
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

export const voteResultsRollUpMessage = (url: string, space: string, proposalIdPrefix: string, proposals: Proposal[]) => {
  return new EmbedBuilder()
    .setColor("#2772af")
    .setTitle("Voting has ended. Thanks for participating!")
    .setURL(url)
    .setDescription(`${String(proposals.length)} proposals`)
    .setAuthor({ name: `📃 GC#${proposals[0].governanceCycle}`, url: `${DEFAULT_DASHBOARD}/s/${space}?cycle=${proposals[0].governanceCycle}` })
    .addFields(
      proposals.map((proposal: Proposal) => {
        if (proposal.voteResults) {
          const [yesWord, noWord] = (proposal.voteResults.choices);
          const [yesVal, noVal] = (proposal.voteResults.scores);
          const emoji = (proposal.status === "Approved") ? EMOJI.APPROVED : EMOJI.CANCELLED;
          const scoresTotal = numToPrettyString(proposal.voteResults.scoresTotal, 0);
          const proposalURL = getProposalURL(space, proposal);
          const quorumMet = (proposal.voteResults.quorumMet) ? "" : " (quorum not met)";
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
