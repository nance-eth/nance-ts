import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
} from "discord.js";
import { createHmac } from "crypto";
import { oneLineTrim } from "common-tags";
import { POLL_KEYWORD } from "./constants";
import { blindPollMessage } from "../templates";
import { getDb } from "@/dolt/pools";
import { getSpaceByConfigValue } from "@/api/helpers/getSpace";
import { keys } from "@/keys";

const YES_POLL_BUTTON_ID = `${POLL_KEYWORD}1`;
const NO_POLL_BUTTON_ID = `${POLL_KEYWORD}0`;

const yesButton = new ButtonBuilder()
  .setCustomId(YES_POLL_BUTTON_ID)
  .setLabel("👍")
  .setStyle(ButtonStyle.Primary);

const noButton = new ButtonBuilder()
  .setCustomId(NO_POLL_BUTTON_ID)
  .setLabel("👎")
  .setStyle(ButtonStyle.Primary);

export const pollActionRow = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(yesButton, noButton);

export async function pollHandler(interaction: ButtonInteraction) {
  const answer = interaction.customId.split(POLL_KEYWORD)[1] === "1";
  const discordId = interaction.user.id;

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

  // init dolt to fetch proposal add poll
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

  // hash discordId and proposal.uuid with secret to get unique id
  const hmac = createHmac("sha256", keys.NEXTAUTH_SECRET);
  const hashDiscordId = hmac.update(`${proposal.governanceCycle}${discordId}${proposal.uuid}`).digest("base64");

  const poll = { id: hashDiscordId, uuidOfProposal: proposal.uuid, answer };
  await dolt.insertPoll(poll);

  // get all polls
  const pollsResults = await dolt.getPollsByProposalUuid(proposal.uuid);
  if (!pollsResults) {
    await interaction.reply({ content: "Something went wrong. Try again 🙏", ephemeral: true });
    return;
  }
  // fetch initial message
  const initialMessage = await interaction.channel?.messages.fetch(interaction.message.id);
  const yes = pollsResults.voteYesUsers.length;
  const no = pollsResults.voteNoUsers.length;
  const results = blindPollMessage({ yes, no });
  initialMessage?.edit({
    embeds: [initialMessage.embeds[0], results],
    components: [pollActionRow]
  });
  await interaction.reply({ content: "Your vote has been recorded", ephemeral: true });
}
