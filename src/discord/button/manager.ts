import { ButtonInteraction } from "discord.js";
import { getSpaceByDiscordGuildId } from "../../api/helpers/getSpace";

export async function buttonManager(interaction: ButtonInteraction) {
  console.log(interaction);
  if (!interaction.guildId) return;
  const space = await getSpaceByDiscordGuildId(interaction.guildId);
  console.log(space.name);
  const answer = interaction.customId.split("poll:")[1];
}
