/* eslint-disable no-await-in-loop */
import { stripIndents } from "common-tags";
import { EmbedBuilder, EmbedField } from "discord.js";
import { ActionPacket, Proposal, SQLPayout } from "@nance/nance-sdk";
import { numberWithCommas } from "@/utils";
import { getPayoutHeadline, getProposalURL } from "../helpers";
import { formatCustomTransaction, formatTransfer } from "./actions";

export const payoutsTable = (payouts: SQLPayout[], governanceCycle: number, space: string, proposalIdPrefix: string) => {
  const message = new EmbedBuilder();
  const toAlert: string[] = [];
  const payoutsText: string[] = [];
  const totalDistribution = payouts.reduce((acc, payout) => { return acc + payout.amount; }, 0);
  payouts.forEach((payout) => {
    const payoutNum = governanceCycle - payout.governanceCycleStart + 1;
    if (payoutNum === payout.numberOfPayouts && payout.numberOfPayouts !== 1) { toAlert.push(`<@${payout.authorDiscordId ?? ""}>`); }
    const payoutHeadline = getPayoutHeadline(payout);
    const payoutHeadlineFull = `[${payoutHeadline.text}](${payoutHeadline.link})`;
    const proposalURL = getProposalURL(space, { proposalId: payout.proposalId, uuid: payout.uuidOfProposal } as Proposal);
    payoutsText.push(`_${payoutNum}/${payout.numberOfPayouts}_ ${payoutHeadlineFull} **$${Number(payout.amount).toLocaleString()}** [[${proposalIdPrefix}${payout.proposalId}]](${proposalURL})\n`);
  });
  message.setDescription(
    stripIndents`
    ## __Payouts for GC${governanceCycle}__
    _Total Distribution:_\n***$${totalDistribution.toLocaleString()}***\n
    ${payoutsText.join("\n")}`);
  return { message, toAlert: toAlert.join(" ") };
};

export const transactionThread = (nonce: number, operation: string, links: EmbedField[]) => {
  const description = links.map((link) => {
    return `[${link.name}](${link.value})`;
  }).join("\n");
  const message = new EmbedBuilder().setTitle(`Tx ${nonce}: ${operation}`).setDescription(description);
  return message;
};

export const reconfigSummary = (
  space: string,
  deadline: Date,
  proposalIdPrefix: string,
  oldDistributionLimit: number,
  newDistributionLimit: number,
  addPayouts: SQLPayout[],
  removePayouts: SQLPayout[],
) => {
  let message = `## __Summary__\nDeadline: <t:${deadline.getTime() / 1000}:F> (<t:${deadline.getTime() / 1000}:R>)\n`;
  if (addPayouts && addPayouts.length > 0) {
    message += `### Add payouts\n`;
    const additions = addPayouts.map((payout, index) => {
      const proposalURL = getProposalURL(space, { proposalId: payout.proposalId } as Proposal);
      const payoutHeadline = getPayoutHeadline(payout);
      const payoutHeadlineFull = `[${payoutHeadline.text}](<${payoutHeadline.link}>)`;
      const line = `  ${index}. [[${proposalIdPrefix}${payout.proposalId}]](${proposalURL}) +$${numberWithCommas(payout.amount)} to ${payoutHeadlineFull}`;
      return line;
    });
    message += additions.join("\n");
  }
  if (removePayouts && removePayouts.length > 0) {
    message += `\n### Remove payouts\n`;
    const removals = removePayouts.map((payout, index) => {
      const proposalURL = getProposalURL(space, { proposalId: payout.proposalId } as Proposal);
      const payoutHeadline = getPayoutHeadline(payout);
      const payoutHeadlineFull = `[${payoutHeadline.text}](<${payoutHeadline.link}>)`;
      const line = `  ${index + 1}. [[${proposalIdPrefix}${payout.proposalId}]](${proposalURL}) -$${numberWithCommas(payout.amount)} to ${payoutHeadlineFull}`;
      return line;
    });
    message += removals.join("\n");
  }
  message += `\n### Old Distribution Limit\n$${numberWithCommas(oldDistributionLimit)}\n`;
  message += `### New Distribution Limit\n$${numberWithCommas(newDistributionLimit)}\n`;
  return message;
};

export const transactionsSummary = async (
  space: string,
  proposalIdPrefix: string,
  actions: ActionPacket[]
) => {
  try {
    const header = `## __Summary__\n`;
    const actionsMdList: string[] = [];
    for (let i = 0; i < actions.length; i += 1) {
      const { action, proposal } = actions[i]
      const proposalURL = getProposalURL(space, { proposalId: proposal.id } as Proposal);
      actionsMdList.push(`${i + 1}. [[${proposalIdPrefix}${proposal.id}]](${proposalURL}) `)
      if (action.type === "Transfer") {
        const { amount, symbolMd, toMd } = await formatTransfer(action);
        actionsMdList[i] += `**[TRANSFER]** ${amount} ${symbolMd} to ${toMd}`;
      }
      if (action.type === "Custom Transaction") {
        const out = await formatCustomTransaction(action);
        actionsMdList[i] += `**[TXN]** ${out}`;
      }
    }
    return `${header}${actionsMdList.join('\n')}`;
  } catch (e: any) {
    throw new Error(e);
  }
}
