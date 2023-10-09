import { SnapshotHandler } from '../snapshot/snapshotHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { keys } from '../keys';
import { dotPin } from '../storage/storageHandler';
import { DEFAULT_DASHBOARD, addSecondsToDate } from '../utils';
import { Action, CustomTransaction, NanceConfig, Payout } from '../types';
import { getENS } from '../api/helpers/ens';

const actionsHeading = '## Proposed Actions\n\n';
const getActionsFooter = (space: string) => { return `*actions appended to proposal body by [Nance](${DEFAULT_DASHBOARD}/s/${space})*`; };
const actionsToMarkdown = async (actions: Action[]) => {
  return actions.map(async (action, index) => {
    if (action.type === 'Custom Transaction') {
      const payload = action.payload as CustomTransaction;
      return `${index}. [${payload.contract}](https://etherscan.io/address/${payload.contract}).${payload.functionName}(${payload.args.join(', ')})`;
    }
    if (action.type === 'Payout') {
      const payload = action.payload as Payout;
      const ens = await getENS(payload.address);
      const toWithLink = (payload.project)
        ? `[Juicebox Project ${payload.project}](https://juicebox.money/v2/p/${payload.project})`
        : `[${ens}](https://etherscan.io/address/${payload.address})`;
      return `${index}. [Juicebox Payout] ${toWithLink} $${payload.amountUSD.toLocaleString()} for ${payload.count} cycle${(payload.count > 1) ? 's' : ''}`;
    }
    return '';
  }).join('\n');
};

export const voteSetup = async (config: NanceConfig, endDate: Date) => {
  const dolt = new DoltHandler(pools[config.name], config.proposalIdPrefix);
  const proposals = await dolt.getVoteProposals();
  if (proposals.length > 0) {
    const snapshot = new SnapshotHandler(keys.PRIVATE_KEY, config);
    const snapshotVoteSettings = await snapshot.getVotingSettings();
    const start = addSecondsToDate(new Date(), -10);
    // if a space has a period set, a proposal must be submitted with that period
    const end = (snapshotVoteSettings.period)
      ? addSecondsToDate(start, snapshotVoteSettings.period)
      : endDate;

    Promise.all(proposals.map(async (proposal) => {
      const proposalWithHeading = `# ${proposal.proposalId} - ${proposal.title}${proposal.body}`;
      // append actions to bottom of proposal
      let bodyWithActions;
      if (proposal.actions) {
        const actionsMarkdown = await actionsToMarkdown(proposal.actions);
        const actionsFooter = getActionsFooter(config.name);
        bodyWithActions = `${proposal.body}\n\n${actionsHeading}\n${actionsMarkdown}\n\n${actionsFooter}`;
      }
      const ipfsURL = await dotPin(proposalWithHeading);
      const type = (proposal.voteSetup) ? proposal.voteSetup.type : (snapshotVoteSettings.type || 'basic');
      const body = bodyWithActions || proposal.body;
      const voteURL = await snapshot.createProposal(
        { ...proposal, body },
        start,
        end,
        { type, choices: proposal.voteSetup?.choices || config.snapshot.choices }
      );
      await dolt.updateVotingSetup({ ...proposal, ipfsURL, voteURL });
    })).catch((e) => {
      return Promise.reject(e);
    });
  }
};
