/* eslint-disable no-await-in-loop */
import {
  CustomTransaction,
  Action,
  Payout,
  Transfer,
  RequestBudget,
  getPayoutCountAmount
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

export const formatCustomTransaction = (action: CustomTransaction) => {
  const functionNameOnly = action.functionName.split("function ")[1].split("(")[0];
  const prettyOutput = action.args.map((arg) => {
    return `*${arg.name}:* ${arg.value}`;
  });
  return `${functionNameOnly}(${prettyOutput.join(", ")})`;
};

export const actionsToMarkdown = async (actions: Action[]) => {
  const results: string[] = [];
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index];
    const { chainId } = action;
    const explorer = chainIdToExplorer(chainId);

    if (action.type === "Custom Transaction") {
      const payload = action.payload as CustomTransaction;
      const contractName = await getContractName(payload.contract);
      await sleep(500); // avoid rate limiting
      results.push(`${index + 1}. **[TXN]** [${contractName}](${explorer}/address/${payload.contract}).${formatCustomTransaction(payload)}`);
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
      results.push(`${index + 1}. **[PAYOUT]** ${toWithLink} $${numberWithCommas(amount)} for ${count} ${maybePlural("cycle", count)} ($${numberWithCommas(amount * count)})`);
    }
    if (action.type === "Transfer") {
      const payload = action.payload as Transfer;

      // hotfix for chainId not being set properly
      const { chainId: chainIdPayload } = payload as any;
      const explorerPayload = chainIdToExplorer(chainIdPayload);
      let symbol = "ETH";
      if (payload.contract !== "ETH") {
        symbol = await getTokenSymbol(payload.contract, action.chainId);
      }
      const symbolMd = payload.contract === "ETH" ? "ETH" :
        `[${symbol}](${explorerPayload}/address/${payload.contract})`;
      const ens = await getENS(payload.to);
      results.push(`${index + 1}. **[TRANSFER]** ${numToPrettyString(payload.amount)} ${symbolMd} to [${ens}](${explorerPayload}/address/${payload.to})`);
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
