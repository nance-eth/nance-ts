import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
} from "discord.js";
import { oneLineTrim } from "common-tags";
import { Proposal } from "@nance/nance-sdk";
import { getDb } from "@/dolt/pools";
import { PUSH_PROPOSAL_KEYWORD } from "./constants";
import { getSpaceByConfigValue } from "@/api/helpers/getSpace";
import { blindPollMessage } from "../templates";
import { pollActionRow } from "./poll";

export const pushProposalActionRow = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(
    new ButtonBuilder()
      .setCustomId(`${PUSH_PROPOSAL_KEYWORD}`)
      .setLabel("Push to next cycle")
      .setStyle(ButtonStyle.Secondary)
  );

export async function pushProposalHandler(interaction: ButtonInteraction) {
  const { space, config } = await getSpaceByConfigValue("discord.guildId", interaction.guildId);
  // check user has verifyRole
  const member = await interaction.guild?.members.fetch(interaction.user.id);
  if (!member?.roles.cache.has(config.discord.poll.verifyRole)) {
    await interaction.reply({
      content: `You must have <@&${config.discord.poll.verifyRole}> role to be eligible`,
      ephemeral: true
    });
    return;
  }

  const dolt = getDb(space);
  // interaction url is different than we store
  const discussionURL = oneLineTrim`https://discord.com/channels/
    ${config.discord.guildId}/
    ${interaction.message.id}
  `;
  const proposal = await dolt.getProposalByThreadURL(discussionURL);
  if (!proposal) {
    await interaction.reply({ content: "Proposal not found 😔", ephemeral: true });
    return;
  }

  if (!proposal.governanceCycle) {
    await interaction.reply({ content: "Proposal cycle missing 😔", ephemeral: true });
    return;
  }

  // update proposal cycle
  const proposalInNextCycle: Proposal = {
    ...proposal,
    governanceCycle: proposal.governanceCycle + 1,
    status: "Temperature Check"
  };

  await dolt.editProposal(proposalInNextCycle);
  // reset poll with initial message
  const initialMessage = await interaction.channel?.messages.fetch(interaction.message.id);
  const yes = 0;
  const no = 0;
  const results = blindPollMessage({ yes, no });
  initialMessage?.edit({
    embeds: [initialMessage.embeds[0], results],
    components: [pollActionRow]
  });
  await interaction.reply({ content: "Proposal pushed to next cycle! 🚀", ephemeral: true });
}
