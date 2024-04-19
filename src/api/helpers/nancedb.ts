import { Proposal } from "@nance/nance-sdk";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { keys } from "../../keys";

const API = "https://db.nance.app";

const account = privateKeyToAccount(`0x${keys.PRIVATE_KEY}`);
const client = createWalletClient({ account, transport: http(`https://mainnet.infura.io/v3/${keys.INFURA_KEY}`) });

export const addProposalToNanceDB = async (space: string, proposal: Proposal) => {
  const signature = await client.signMessage({ message: "NANCE", account });
  const response = await fetch(`${API}/s/${space}/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      {
        proposal,
        uploaderAddress: account.address,
        uploaderSignature: signature,
      }
    ),
  });
  return response.json();
};
