import { ButtonInteraction } from "discord.js";
import { BUTTON_KEYWORD, POLL_KEYWORD, PUSH_PROPOSAL_KEYWORD } from "./constants";
import { pollHandler } from "./poll";
import { pushProposalHandler } from "./pushProposal";

console.log(`[DISCORD] Will respond to polls containing: "${BUTTON_KEYWORD}"`);

export async function buttonManager(interaction: ButtonInteraction) {
  try {
    if (!interaction.guildId) return;

    // so deployed bot doesn't respond when doing dev
    const respondToInteraction = interaction.customId.includes(BUTTON_KEYWORD);
    if (!respondToInteraction) return;

    if (interaction.customId.includes(POLL_KEYWORD)) {
      await pollHandler(interaction);
    }

    if (interaction.customId.includes(PUSH_PROPOSAL_KEYWORD)) {
      await pushProposalHandler(interaction);
    }
  } catch (error) {
    console.log(error);
    console.error("Hosted bot most likely handled interaction");
  }
}
