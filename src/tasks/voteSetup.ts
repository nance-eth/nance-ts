import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { keys } from '../keys';
import { dotPin } from '../storage/storageHandler';
import { DEFAULT_DASHBOARD, addSecondsToDate, maybePlural } from '../utils';
import { Action, CustomTransaction, NanceConfig, Payout, Proposal, Transfer } from '../types';
import { getENS } from '../api/helpers/ens';
import logger from '../logging';

const actionsHeading = '## Proposed Actions\n\n';

export const formatCustomTransaction = (action: CustomTransaction) => {
  const functionNameOnly = action.functionName.split('function ')[1];
  const regex = /(\w+)\s+(\w+)(?=[,)])/g;
  const inputsWithType = Array.from(functionNameOnly.matchAll(regex), (match) => { return [match[1], match[2]]; });
  const prettyOutput = inputsWithType.map((input, index) => {
    return `${input[1]}(${input[0]}): ${action.args[index]}`;
  });
  return prettyOutput.join(', ');
};

const getActionsFooter = (space: string) => { return `*actions appended to proposal body by [Nance](${DEFAULT_DASHBOARD}/s/${space})*`; };
export const actionsToMarkdown = async (actions: Action[]) => {
  const results = await Promise.all(actions.map(async (action, index) => {
    if (action.type === 'Custom Transaction') {
      const payload = action.payload as CustomTransaction;
      return `${index + 1}. [${payload.contract}](https://etherscan.io/address/${payload.contract}).(${formatCustomTransaction(payload)})`;
    }
    if (action.type === 'Payout') {
      const payload = action.payload as Payout;
      const ens = await getENS(payload.address);
      const toWithLink = (payload.project)
        ? `[Juicebox Project ${payload.project}](https://juicebox.money/v2/p/${payload.project})`
        : `[${ens}](https://etherscan.io/address/${payload.address})`;
      return `${index + 1}. *Juicebox Payout* ${toWithLink} $${payload.amountUSD.toLocaleString()} for ${payload.count} ${maybePlural('cycle', payload.count)}`;
    }
    if (action.type === 'Transfer') {
      const payload = action.payload as Transfer;
      const ens = await getENS(payload.to);
      return `${index + 1}. *Transfer* ${payload.amount} [${payload.contract}](https://etherscan.io/address/${payload.contract}) to [${ens}](https://etherscan.io/address/${payload.to})`;
    }
    return '';
  }));
  return results.join('\n');
};

export const voteSetup = async (config: NanceConfig, endDate: Date, proposals?: Proposal[]) => {
  try {
    const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
    const voteProposals = proposals || await dolt.getVoteProposals();
    if (voteProposals.length === 0) return;
    const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, config);
    const snapshotVoteSettings = await snapshot.getVotingSettings().then((settings) => {
      return settings;
    }).catch((e) => {
      logger.error(`error getting snapshot vote settings for ${config.name}`);
      logger.error(e);
      return undefined;
    });

    // used to pick a more random previous block to take snapshot of token balances per DrGorilla.eth's recommendation
    const blockJitter = Math.floor(Math.random() * 100);

    await Promise.all(voteProposals.map(async (proposal) => {
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
        const actionsFooter = getActionsFooter(config.name);
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
      await dolt.updateVotingSetup({ ...proposal, ipfsURL, voteURL });
    })).catch((e) => {
      return Promise.reject(e);
    });
  } catch (e) {
    logger.error(`error setting up vote for ${config.name}`);
    logger.error(e);
  }
};
