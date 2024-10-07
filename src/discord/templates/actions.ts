/* eslint-disable no-await-in-loop */
import {
  CustomTransaction,
  Action,
  Payout,
  Transfer,
  RequestBudget,
  getPayoutCountAmount,
  Cancel
} from "@nance/nance-sdk";
import {
  sleep,
  maybePlural,
  chainIdToExplorer,
  getContractName,
  numberWithCommas,
  numToPrettyString,
  getTokenSymbol,
} from "@/utils";
import { getProjectHandle } from "@/juicebox/api";
import { getENS } from "@/api/helpers/ens";

export const formatCustomTransaction = async (action: Action) => {
  try {
    const payload = action.payload as CustomTransaction;
    // hotfix for chainId not being set properly
    const { chainId } = action || { chainId: (payload as any).chainId } || { chainId: 1 };
    const explorer = chainIdToExplorer(chainId);
    const contractName = await getContractName(payload.contract);
    await sleep(500); // avoid rate limiting
    const functionName = payload.functionName.split("function ")[1].split("(")[0];
    const prettyArgs = payload.args.map((arg) => {
      return `*${arg.name}:* ${arg.value}`;
    }).join(", ");
    const contractMd = `[${contractName}](<${explorer}/address/${payload.contract}>)`;
    return `${contractMd}.${functionName}(${prettyArgs})`;
  } catch (e: any) {
    throw new Error(e);
  }
};

export const formatTransfer = async (action: Action) => {
  const payload = action.payload as Transfer;

  // hotfix for chainId not being set properly
  const { chainId: chainIdPayload } = payload as any;
  const explorerPayload = chainIdToExplorer(chainIdPayload);
  let symbol = "ETH";
  if (payload.contract !== "ETH") {
    symbol = await getTokenSymbol(payload.contract, action.chainId);
  }
  const symbolMd = payload.contract === "ETH" ? "ETH" :
    `[${symbol}](<${explorerPayload}/address/${payload.contract}>)`;
  const ens = await getENS(payload.to);
  const toMd = `[${ens}](<${explorerPayload}/address/${payload.to}>)`;
  const amount = numToPrettyString(payload.amount, 3);
  return { amount, symbolMd, toMd };
};

export const actionsToMarkdown = async (actions: Action[]) => {
  const results: string[] = [];
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index];
    const { chainId } = action;
    const explorer = chainIdToExplorer(chainId);

    const milestoneText = action.pollRequired ? " **[MILESTONE]**" : "";
    if (action.type === "Custom Transaction") {
      results.push(`${index + 1}. **[TXN]** `);
    }
    if (action.type === "Payout") {
      const { amount, count } = getPayoutCountAmount(action);
      const payout = action.payload as Payout;
      const ens = await getENS(payout.address);
      const projectHandle = await getProjectHandle(payout.project);
      const projectLinkText = (projectHandle) ? `[@${projectHandle} *(${payout.project})*](https://juicebox.money/@${projectHandle})` : `[ProjectId ${payout.project}](https://juicebox.money/v2/p/${payout.project})`;
      const toWithLink = (payout.project)
        ? projectLinkText
        : `[${ens}](${explorer}/address/${payout.address})`;
      results.push(`${index + 1}. **[PAYOUT]** ${toWithLink} $${numberWithCommas(amount)} for ${count} ${maybePlural("cycle", count)} ($${numberWithCommas(amount * count)})${milestoneText}`);
    }
    if (action.type === "Transfer") {
      const { amount, symbolMd, toMd } = await formatTransfer(action);
      results.push(`${index + 1}. **[TRANSFER]** ${amount} ${symbolMd} to ${toMd}${milestoneText}`);
    }
    if (action.type === "Cancel") {
      const payload = action.payload as Cancel;
      results.push(`${index + 1}. **[CANCEL]** ${payload.targetActionDescription}${milestoneText}`);
    }
    if (action.type === "Request Budget") {
      const payload = action.payload as RequestBudget;
      const transferMap: { [key: string]: number } = {};
      payload.budget.forEach(async (lineItem) => {
        let symbol = lineItem.token;
        if (lineItem.token === "ETH") {
          symbol = "ETH";
        } else {
          symbol = await getTokenSymbol(lineItem.token);
        }
        transferMap[symbol] = (transferMap[symbol] || 0) + Number(lineItem.amount);
      });
      const tokensText = Object.entries(transferMap).map(([token, amount]) => {
        return `${numberWithCommas(amount)} ${token}`;
      }).join("\n");
      const teamText = payload.projectTeam.map((teamMember) => {
        return `* <@${teamMember.discordUserId}>`;
      }).join("\n");
      results.push(`**[BUDGET REQUEST]**\n${tokensText}\n\n**[TEAM MEMBERS]**\n${teamText}`);
    }
  }
  return results.join("\n");
};
