import { Nance } from '../nance';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const treasury = new NanceTreasury(config, nance.proposalHandler);
  const gnosis = await GnosisHandler.initializeSafe(config.juicebox.gnosisSafeAddress, config.juicebox.network);
  const { address, bytes } = await treasury.V2encodeReconfigureFundingCyclesOf();
  const gnosisInfo = await gnosis.getGasEstimate({
    to: address,
    value: '0',
    operation: 0,
    data: bytes
  }).catch((e) => { console.log(e) });
  // const nextNonce = Number(await gnosis.getCurrentNonce()) + 1;
  const nextNonce = 166
  console.log(bytes);
  gnosis.sendTransaction({
    to: address,
    value: '0',
    data: bytes,
    operation: 0,
    gasToken: gnosisInfo.gasToken,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    refundReceiver: ZERO_ADDRESS,
    nonce: nextNonce
  }).catch((e) => { console.log(e) });
}

main();
