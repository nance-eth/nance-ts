import { Nance } from '../nance';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { NanceTreasury } from '../treasury';
import { getSpaceInfo } from '../api/helpers/getSpace';
import { myProvider } from '../utils';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function main() {
  const { config, currentCycle } = await getSpaceInfo(process.env.CONFIG || '');
  const nance = new Nance(config);
  const treasury = new NanceTreasury(config, nance.dProposalHandler, myProvider(), currentCycle);
  const gnosis = await GnosisHandler.initializeSafe(config.juicebox.gnosisSafeAddress, config.juicebox.network);
 // const { address, bytes } = await treasury.V2encodeReconfigureFundingCyclesOf();
 const { address, bytes } = await treasury.juiceboxHandlerV3.encodeDistributeFundsOf();
  // const gnosisInfo = await gnosis.getGasEstimate({
  //   to: address,
  //   value: '0',
  //   operation: 0,
  //   data: bytes
  // }).catch((e) => { console.log(e) });
  const nextNonce = Number(await gnosis.getCurrentNonce(false)) + 1;
  gnosis.sendTransaction({
    to: address,
    value: '0',
    data: bytes,
    operation: 0,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    nonce: nextNonce
  }).catch((e) => { console.log(e) });
}

main();
