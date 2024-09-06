import { isEqual } from "lodash";
import { NanceConfig, Proposal, ProposalStatus } from "@nance/nance-sdk";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { DiscordHandler } from "@/discord/discordHandler";
import { getLastSlash, sleep } from "@/utils";
import { buttonManager } from "@/discord/button/manager";

export const discordLogin = async (config: NanceConfig) => {
  const discord = new DiscordHandler(config);
  // eslint-disable-next-line no-await-in-loop
  while (!discord.ready()) { await sleep(50); }
  return discord;
};

export const discordInitButtonManager = async () => {
  if (process.env.LOCAL_DB) return;
  try {
    const discord = new Client({
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
  } catch (e) {
    console.error("[DISCORD] Login failed!");
  }
};

const createThreadStatuses: ProposalStatus[] = ["Discussion", "Temperature Check"];
export const discordNewProposal = async (proposal: Proposal, config: NanceConfig) => {
  const { status } = proposal;
  if (!createThreadStatuses.includes(status)) return null;
  const discord = await discordLogin(config);
  const discussionThreadURL = await discord.startDiscussion(proposal);
  if (proposal.authorAddress) await discord.setupPoll(getLastSlash(discussionThreadURL));
  discord.logout();
  return discussionThreadURL;
};

export const discordEditProposal = async (
  proposal: Proposal,
  proposalInDb: Proposal,
  config: NanceConfig
) => {
  const { status } = proposal;
  const shouldCreateDiscussion = (
    (proposalInDb.status === "Draft")
    && status === "Discussion" && !proposalInDb.discussionThreadURL
  );
  const discord = await discordLogin(config);
  if (shouldCreateDiscussion) {
    const discussionThreadURL = await discord.startDiscussion(proposal);
    if (proposal.authorAddress) await discord.setupPoll(getLastSlash(discussionThreadURL));
    discord.logout();
    return discussionThreadURL;
  }

  // if proposal got sponsored by a valid author,
  // add Temperature Check embed and setup poll buttons
  if (proposalInDb.status === "Discussion" && status === "Temperature Check") {
    await discord.editDiscussionMessage(proposal);
    await discord.setupPoll(getLastSlash(proposalInDb.discussionThreadURL));
  }

  // archive alert
  if (proposal.status === "Archived") {
    try { await discord.sendProposalArchive(proposalInDb); } catch (e) { console.error(`[DISCORD] ${e}`); }
  }
  // unarchive alert
  if (proposal.status === config.proposalSubmissionValidation?.metStatus && proposalInDb.status === "Archived") {
    try { await discord.sendProposalUnarchive(proposalInDb); } catch (e) { console.error(`[DISCORD] ${e}`); }
  }

  // send edit alert to discord
  const actionsChanged = !isEqual(proposalInDb.actions, proposal.actions);
  const diff = !isEqual(proposalInDb.body, proposal.body);
  if (
    proposal.status !== "Archived" &&
    proposalInDb.discussionThreadURL &&
    (diff || actionsChanged || proposalInDb.title !== proposal.title)
  ) {
    const { discussionThreadURL } = proposalInDb;
    const editProposal = { ...proposal, discussionThreadURL };
    await discord.editDiscussionMessage(editProposal);
    if (diff) await discord.sendProposalDiff(editProposal);
  }
  discord.logout();
  return null;
};
