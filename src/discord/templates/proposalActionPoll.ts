import { ActionPacket } from "@nance/nance-sdk";
import { stripIndents } from "common-tags";
import { EmbedBuilder } from "discord.js";
import { actionsToMarkdown } from "./actions";

export const proposalActionPoll = async (actionPacket: ActionPacket) => {
  const actionMd = await actionsToMarkdown([actionPacket.action]);
  return new EmbedBuilder().setColor("#009460")
    .setDescription(stripIndents`
      ## New Poll\n
      Should this action be added to the next governance cycle?\n
      ${actionMd}
    `);
};
