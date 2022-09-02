import { Nance } from '../nance';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const treasury = new NanceTreasury(config, nance);
  const gnosis = await GnosisHandler.initializeSafe(config.juicebox.gnosisSafeAddress, config.juicebox.network);
  const { address, data } = await treasury.encodeReconfigureFundingCyclesOf(0);
  const gnosisInfo = await gnosis.getGasEstimate({
    to: address,
    value: '0',
    operation: 0,
    data
  });
  const nextNonce = Number(await gnosis.getCurrentNonce()) + 1;
  gnosis.sendTransaction({
    to: address,
    value: '0',
    data,
    operation: 0,
    gasToken: gnosisInfo.gasToken,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    refundReceiver: ZERO_ADDRESS,
    nonce: nextNonce
  })
}

main();
