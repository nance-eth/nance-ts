import { ethers } from 'ethers';
import snapshot from '@snapshot-labs/snapshot.js';
import { keys } from '../../keys';
import { unixTimeStampNow, addSecondsToDate, dateToUnixTimeStamp } from '../../utils';

const SPACE = 'jigglyjams.eth';
const PROPOSAL = {
  hash: '',
  status: 'Draft',
  type: 'Payout',
  governanceCycle: undefined,
  proposalId: '1',
  author: '',
  version: '1',
  title: 'newnenwenwe',
  // eslint-disable-next-line max-len
  body: 'Status: Draft\n\n```\nAuthor:\nDate: (YYYY-MM-DD)\n```\n\n## Synopsis\n\n*State what the proposal does in one sentence.*\n\n## Motivation\n\n*What problem does this solve? Why now?* \n\n## Specification\n\n*How exactly will this be executed? Be specific and leave no ambiguity.* \n\n## Rationale\n\n*Why is this specification appropriate?*\n\n## Risks\n\n*What might go wrong?*\n\n## Timeline\n\n*When exactly should this proposal take effect? When exactly should this proposal end?*',
  discussionThreadURL: '',
  ipfsURL: '',
  voteURL: '',
  url: '',
  payout: {
    type: 'address',
    count: 3,
    amountUSD: 1800,
    address: '0x25910143C255828F623786f46fe9A8941B7983bB',
    payName: 'testing123 payout'
  }
};

async function createProposal() {
  const provider = new ethers.providers.AlchemyProvider('mainnet', keys.PROVIDER_KEY);
  const wallet = new ethers.Wallet(keys.PRIVATE_KEY, provider);
  const latestBlock = await provider.getBlockNumber();
  const hub = 'https://hub.snapshot.org';
  const snapshotClient = new snapshot.Client712(hub);
  const now = new Date();
  snapshotClient.proposal(wallet, wallet.address, {
    space: SPACE,
    type: 'basic',
    title: `${PROPOSAL.proposalId} - ${PROPOSAL.title}`,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    body: PROPOSAL.body!,
    discussion: PROPOSAL.discussionThreadURL,
    choices: ['For', 'Against', 'Abstain'],
    start: dateToUnixTimeStamp(now),
    end: dateToUnixTimeStamp(addSecondsToDate(now, 60 * 10)),
    snapshot: latestBlock,
    plugins: JSON.stringify({}),
  }).then((response) => {
    console.log(response);
  }).catch((e) => {
    console.log(e);
  });
}

createProposal();
