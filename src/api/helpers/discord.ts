import SafeApiKit from "@safe-global/api-kit";
import { isEqual } from "lodash";
import { ActionPacket, NanceConfig, Proposal, ProposalStatus } from "@nance/nance-sdk";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { DiscordHandler } from "@/discord/discordHandler";
import { getLastSlash, networkNameToChainId, sleep } from "@/utils";
import { buttonManager } from "@/discord/button/manager";

export const discordLogin = async (config: NanceConfig) => {
  const discord = new DiscordHandler(config);
  // eslint-disable-next-line no-await-in-loop
  while (!discord.ready()) { await sleep(50); }
  return discord;
};

export const discordInitInteractionManager = async () => {
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
      console.log(`[DISCORD] logged in as ${discord.user?.tag}`);
      discord.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) return;
        await buttonManager(interaction);
      });
    });
  } catch (e) {
    console.error("[DISCORD] Login failed!");
  }
};

const createThreadStatuses: ProposalStatus[] = ["Draft", "Discussion", "Temperature Check"];
export const discordNewProposal = async (proposal: Proposal, config: NanceConfig) => {
  const { status } = proposal;
  if (!createThreadStatuses.includes(status)) return null;
  if (status === "Draft" && !config.discord.channelIds.ideas) return null;
  const discord = await discordLogin(config);
  const discussionThreadURL = await discord.startDiscussion(proposal);
  if (proposal.authorAddress && status !== "Draft") {
    await discord.setupPoll(getLastSlash(discussionThreadURL));
  }
  discord.logout();
  return discussionThreadURL;
};

export const discordEditProposal = async (
  proposal: Proposal,
  proposalInDb: Proposal,
  config: NanceConfig
) => {
  const { status } = proposal;
  const ideasChannelExists = !!config.discord.channelIds.ideas;
  const thread = proposalInDb.discussionThreadURL;
  const shouldCreateDiscussion = (
    proposalInDb.status === "Draft" && status === "Discussion" && !thread
  ) || (
    proposalInDb.status === "Draft" && ideasChannelExists && status === "Discussion"
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
    if (!proposalInDb.discussionThreadURL) throw Error("Proposal has no Discord thread");
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

export const discordTransactionThread = async (
  config: NanceConfig,
  currentGovernanceCycle: number,
  safeTxnUrl: string,
  actions: ActionPacket[],
) => {
  // get next Safe nonce
  try {
    const networkId = networkNameToChainId(config.juicebox.network);
    const safe = new SafeApiKit({ chainId: BigInt(networkId) });
    const nonce = await safe.getNextNonce(config.juicebox.gnosisSafeAddress);
    const links = [
      { name: "✍️ Safe Transaction", value: safeTxnUrl, inline: true },
    ];
    const discord = await discordLogin(config);
    const threadId = await discord.createLinkThread(nonce, `Transactions GC#${currentGovernanceCycle}`, links);
    const summaryThread = await discord.sendTransactionsSummary(threadId, actions);
    return summaryThread;
  } catch (e: any) {
    throw new Error(e);
  }
};
