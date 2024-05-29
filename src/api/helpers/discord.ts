import { NanceConfig } from '@nance/nance-sdk';
import {
  Client as DiscordClient,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { DiscordHandler } from '../../discord/discordHandler';
import { sleep } from '../../utils';
import { buttonManager } from "../../discord/button/manager";

export const discordLogin = async (config: NanceConfig) => {
  const discord = new DiscordHandler(config);
  // eslint-disable-next-line no-await-in-loop
  while (!discord.ready()) { await sleep(50); }
  return discord;
};

export const discordInitButtonManager = async () => {
  const discord = new DiscordClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers,
    ]
  });
  await discord.login(process.env.DISCORD_KEY_NANCE).then(() => {
    console.log(`logged in as ${discord.user?.tag}`);
    discord.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isButton()) return;
      await buttonManager(interaction);
    });
  });
};
