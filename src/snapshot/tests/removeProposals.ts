import { ethers } from 'ethers';
import snapshot from '@snapshot-labs/snapshot.js';
import { CancelProposal } from '@snapshot-labs/snapshot.js/dist/sign/types';
import { request as gqlRequest, gql } from 'graphql-request';
import { keys } from '../../keys';
import { unixTimeStampNow, myProvider } from '../../utils';

const SPACE = 'jbdao.eth';

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
        id_in: ["0xcf4f236860321a31aca1399b28249278cfa3a5129a7e98f21df4bcca04ed600d", "0xd9477cabc2879a2465b49796d0c6cc3dccd4bbadb70c9da818850c9d29287af7"]
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
