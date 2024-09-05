import { Proposal } from "@nance/nance-sdk";
import { EmbedBuilder } from "discord.js";

export const proposalActionPoll = (proposal: Proposal, proposalIdPrefix: string) => {
  return new EmbedBuilder().setColor("#009460")
    .setTitle(`Poll: ${proposalIdPrefix}${proposal.proposalId}: ${proposal.title}`)
    .setDescription("Should this action be added to the next governance cycle?");
};
