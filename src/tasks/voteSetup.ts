import { Action, CustomTransaction, NanceConfig, Payout, Proposal, Transfer } from '@nance/nance-sdk';
import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { keys } from '../keys';
import { dotPin } from '../storage/storageHandler';
import { DEFAULT_DASHBOARD, addSecondsToDate, maybePlural, numberWithCommas } from '../utils';
import { getENS } from '../api/helpers/ens';
import logger from '../logging';
import { getProjectHandle } from "../juicebox/api";

const actionsHeading = '## Proposed Actions\n\n';

export const formatCustomTransaction = (action: CustomTransaction) => {
  const functionNameOnly = action.functionName.split('function ')[1].split('(')[0];
  const prettyOutput = action.args.map((arg) => {
    return `*${arg.name}:* ${arg.value}`;
  });
  return `${functionNameOnly}(${prettyOutput.join(', ')})`;
};

const getActionsFooter = (space: string) => { return `*actions appended to proposal body by [Nance](${DEFAULT_DASHBOARD}/s/${space})*`; };
export const actionsToMarkdown = async (actions: Action[]) => {
  const results = await Promise.all(actions.map(async (action, index) => {
    if (action.type === 'Custom Transaction') {
      const payload = action.payload as CustomTransaction;
      return `${index + 1}. **[TXN]** [${payload.contract}](https://etherscan.io/address/${payload.contract}).${formatCustomTransaction(payload)}`;
    }
    if (action.type === 'Payout') {
      const payload = action.payload as Payout;
      const ens = await getENS(payload.address);
      const projectHandle = await getProjectHandle(payload.project);
      const projectLinkText = (projectHandle) ? `[@${projectHandle} *(${payload.project})*](https://juicebox.money/@${projectHandle})` : `[ProjectId ${payload.project}](https://juicebox.money/v2/p/${payload.project})`;
      const toWithLink = (payload.project)
        ? projectLinkText
        : `[${ens}](https://etherscan.io/address/${payload.address})`;
      return `${index + 1}. **[PAYOUT]** ${toWithLink} $${numberWithCommas(payload.amountUSD)} for ${payload.count} ${maybePlural('cycle', payload.count)} ($${numberWithCommas(payload.amountUSD * payload.count)})`;
    }
    if (action.type === 'Transfer') {
      const payload = action.payload as Transfer;
      const contract = payload.contract === "ETH" ?
        payload.contract :
        `[${payload.contract}](https://etherscan.io/address/${payload.contract})`;
      const ens = await getENS(payload.to);
      return `${index + 1}. **[TRANSFER]** ${payload.amount} ${contract} to [${ens}](https://etherscan.io/address/${payload.to})`;
    }
    return undefined;
  }));
  return results.join('\n');
};

export const voteSetup = async (space: string, config: NanceConfig, endDate: Date, proposals?: Proposal[]) => {
  try {
    const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
    const voteProposals = proposals || await dolt.getVoteProposals();
    if (voteProposals.length === 0) return [];
    const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, config);
    const snapshotVoteSettings = await snapshot.getVotingSettings().then((settings) => {
      return settings;
    }).catch((e) => {
      logger.error(`error getting snapshot vote settings for ${space}`);
      logger.error(e);
      return undefined;
    });

    // used to pick a more random previous block to take snapshot of token balances per DrGorilla.eth's recommendation
    const blockJitter = Math.floor(Math.random() * 100);

    const updatedProposals = await Promise.all(voteProposals.map(async (proposal) => {
      const startJitter = Math.floor(Math.random() * 100); // it seems that sometimes proposals uploaded at same time are rejected by Snapshot API
      const start = addSecondsToDate(new Date(), startJitter);
      // if a space has a period set, a proposal must be submitted with that period
      const end = (snapshotVoteSettings?.period)
        ? addSecondsToDate(start, snapshotVoteSettings.period)
        : endDate;
      // append actions to bottom of proposal
      let bodyWithActions;
      if (proposal.actions && proposal.actions.length > 0) {
        const actionsMarkdown = await actionsToMarkdown(proposal.actions);
        const actionsFooter = getActionsFooter(space);
        bodyWithActions = `${proposal.body}\n\n${actionsHeading}\n${actionsMarkdown}\n\n${actionsFooter}`;
      }
      const proposalWithHeading = `# ${proposal.proposalId} - ${proposal.title}${bodyWithActions || proposal.body}`;
      const ipfsURL = await dotPin(proposalWithHeading);
      const type = (proposal.voteSetup) ? proposal.voteSetup.type : (snapshotVoteSettings?.type || 'basic');
      const body = bodyWithActions || proposal.body;
      const voteURL = await snapshot.createProposal(
        { ...proposal, body },
        start,
        end,
        { type, choices: proposal.voteSetup?.choices || config.snapshot.choices },
        blockJitter
      );
      const updatedProposal: Proposal = { ...proposal, ipfsURL, voteURL };
      await dolt.updateVotingSetup(updatedProposal);
      return updatedProposal;
    })).catch((e) => {
      return Promise.reject(e);
    });
    return updatedProposals;
  } catch (e) {
    logger.error(`error setting up vote for ${space}`);
    logger.error(e);
    return Promise.reject(e);
  }
};
