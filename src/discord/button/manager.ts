import { ButtonInteraction } from "discord.js";
import { createHmac } from "crypto";
import { oneLineTrim } from "common-tags";
import { getSpaceByDiscordGuildId } from "../../api/helpers/getSpace";
import { keys } from "../../keys";
import { DoltHandler } from "../../dolt/doltHandler";
import { pools } from "../../dolt/pools";
import { blindPollMessage } from "../discordTemplates";
import { ID_KEYWORD, pollActionRow } from "./poll";

export async function buttonManager(interaction: ButtonInteraction) {
  try {
    if (!interaction.guildId) return;
    const { name, config } = await getSpaceByDiscordGuildId(interaction.guildId);

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
    const dolt = new DoltHandler(pools[name], config.proposalIdPrefix);
    // interaction url is different than we store
    const discussionURL = oneLineTrim`https://discord.com/channels/
      ${config.discord.guildId}/
      ${config.discord.channelIds.proposals}/
      ${interaction.message.id}
    `;
    const proposal = await dolt.getProposalByThreadURL(discussionURL);
    if (!proposal) {
      await interaction.reply({ content: "Proposal not found 😔", ephemeral: true });
      return;
    }

    // so deployed bot doesn't respond when doing dev
    const respondToInteraction = interaction.customId.includes(ID_KEYWORD);
    if (!respondToInteraction) return;
    const answer = interaction.customId.split(ID_KEYWORD)[1] === "1";
    const discordId = interaction.user.id;

    // hash discordId and proposal.uuid with secret to get unique id
    const hmac = createHmac("sha256", keys.NEXTAUTH_SECRET);
    const hashDiscordId = hmac.update(`${discordId}${proposal.uuid}`).digest("base64");

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
  } catch (error) {
    console.error("Hosted bot most likely handled interaction");
  }
}
