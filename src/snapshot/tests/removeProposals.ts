import { ethers } from 'ethers';
import snapshot from '@snapshot-labs/snapshot.js';
import { CancelProposal } from '@snapshot-labs/snapshot.js/dist/sign/types';
import { request as gqlRequest, gql } from 'graphql-request';
import { keys } from '../../keys';
import { unixTimeStampNow, myProvider } from '../../utils';

const SPACE = 'jigglyjams.eth';

async function deleteProposals() {
  const provider = myProvider();
  const wallet = new ethers.Wallet(keys.PRIVATE_KEY, provider);

  const hub = 'https://hub.snapshot.org';
  const snapshotClient = new snapshot.Client712(hub);

  const query = gql`
    {
      proposals(where: {
        space: "${SPACE}"
        state: "active"
      }) {
        id
      }
    }
  `;
  console.log(query);
  const proposalsToDelete = (await gqlRequest(`${hub}/graphql`, query)).proposals.map((response:any) => {
    return response.id;
  });
  proposalsToDelete.forEach(async (proposalId: string) => {
    const cancelMessage: CancelProposal = {
      space: SPACE,
      from: wallet.address,
      timestamp: unixTimeStampNow(),
      proposal: proposalId
    };
    snapshotClient.cancelProposal(wallet, wallet.address, cancelMessage);
  });
}

deleteProposals();
