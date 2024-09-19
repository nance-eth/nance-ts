import { ThreadChannel, Message } from "discord.js";
import { Proposal, SQLPayout } from "@nance/nance-sdk";
import { EMOJI, DEFAULT_DASHBOARD } from "@/constants";

export const getProposalURL = (space: string, proposal: Proposal, customDomain?: string) => {
  if (customDomain) return `${customDomain}/proposal/${proposal.proposalId || proposal.uuid}`;
  return `${DEFAULT_DASHBOARD}/s/${space}/${proposal.proposalId || proposal.uuid}`;
};

export const simpleProposalList = (
  proposals: Proposal[],
  space: string,
  proposalIdPrefix: string,
  customDomain?: string
) => {
  const list = proposals.map((proposal) => {
    let emoji = '';
    if (proposal.status === 'Temperature Check') { emoji = EMOJI.TEMPERATURE_CHECK; }
    if (proposal.status === 'Voting') { emoji = EMOJI.VOTE; }
    if (proposal.status === 'Discussion') { emoji = EMOJI.DISCUSSION; }
    if (proposal.status === 'Approved') { emoji = EMOJI.APPROVED; }
    if (proposal.status === 'Cancelled') { emoji = EMOJI.CANCELLED; }
    return `${emoji}\u00a0[${proposalIdPrefix}${proposal.proposalId}: ${proposal.title}](${getProposalURL(space, proposal, customDomain)})`;
  }).join('\n');
  if (list === '') { return 'None'; }
  return list;
};

export const threadToURL = (thread: ThreadChannel) => {
  return `https://discord.com/channels/${thread.guildId}/${thread.id}`;
};

export const getPreamble = (type: string) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('delay')) { return 'Submit a proposal'; }
  if (typeLower.includes('execution')) { return 'Multisig members assemble and configure the next funding cycle'; }
  if (typeLower.includes('temperature check')) { return 'Take part in the temperature checks'; }
  if (typeLower.includes('vote')) { return 'Take part in the voting'; }
  return undefined;
};

export const getPayoutHeadline = (payout: SQLPayout) => {
  if (payout.payProjectHandle) { return { text: `@${payout.payProjectHandle} (v2p${payout.payProject})`, link: `https://juicebox.money/@${payout.payProjectHandle}` }; }
  if (payout.payProject) { return { text: `v2p${payout.payProject}`, link: `https://juicebox.money/v2/p/${payout.payProject}` }; }
  if (payout.payENS) { return { text: `${payout.payENS}`, link: `https://etherscan.com/address/${payout.payAddress}` }; }
  return { text: `${payout.payAddress?.slice(0, 5)}...${payout.payAddress?.slice(38)}`, link: `https://etherscan.com/address/${payout.payAddress}` };
};

export const removeReacts = async (message: Message) => {
  message.reactions.cache.forEach((reaction) => {
    reaction.users.remove(message.client.user.id);
  });
};
