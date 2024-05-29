import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";

const yesButton = new ButtonBuilder()
  .setCustomId("poll:1")
  .setLabel("👍")
  .setStyle(ButtonStyle.Primary);

const noButton = new ButtonBuilder()
  .setCustomId("poll:0")
  .setLabel("👎")
  .setStyle(ButtonStyle.Primary);

export const pollActionRow = new ActionRowBuilder<ButtonBuilder>()
  .addComponents(yesButton, noButton);
