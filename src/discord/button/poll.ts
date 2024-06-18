import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";

export const ID_KEYWORD = (process.env.NODE_ENV === "production") ? "poll:" : "DEV:POLL:";
const YES_POLL_BUTTON_ID = `${ID_KEYWORD}1`;
const NO_POLL_BUTTON_ID = `${ID_KEYWORD}0`;

console.log(`Will respond to polls containing: "${ID_KEYWORD}"`);

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
