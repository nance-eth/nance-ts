import { ethers } from 'ethers';
import { fetchABI } from '../transactionHandler';

const name = 'function burnTokensOf(address _holder, uint256 _projectId, uint256 _tokenCount, string _memo, bool _preferClaimedTokens)';

async function main() {
  const iface = new ethers.utils.Interface([`${name}`]);
  console.dir(iface, { depth: null });
  console.log(iface.encodeFunctionData(name.split('function ')[1], ['0xca6Ed3Fdc8162304d7f1fCFC9cA3A81632d5E5B0', '1', '1', 'hi', true]));

  const abi = await fetchABI('0x97a5b9D9F0F7cD676B69f584F29048D0Ef4BB59b');
  const iface2 = new ethers.utils.Interface(abi);
  console.log(iface2.encodeFunctionData(name.split('function ')[1], ['0xca6Ed3Fdc8162304d7f1fCFC9cA3A81632d5E5B0', '1', '1', 'hi', true]));
}

main();
