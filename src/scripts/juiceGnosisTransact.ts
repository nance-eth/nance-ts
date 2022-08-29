import { Nance } from '../nance';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const treasury = new NanceTreasury(config, nance);
  const gnosis = await GnosisHandler.initializeSafe(config.juicebox.gnosisSafeAddress, config.juicebox.network);
  const { address, data } = await treasury.encodeReconfigureFundingCyclesOf();
  const gnosisInfo = await gnosis.getGasEstimate({
    to: address,
    value: '0',
    operation: 0,
    data
  });
  const nextNonce = Number(await gnosis.getCurrentNonce())
  gnosis.sendTransaction({
    to: address,
    value: '0',
    data,
    operation: 0,
    gasToken: gnosisInfo.gasToken,
    safeTxGas: Number(gnosisInfo.safeTxGas),
    baseGas: Number(gnosisInfo.baseGas),
    gasPrice: Number(gnosisInfo.gasPrice),
    refundReceiver: gnosisInfo.refundReceiver,
    nonce: nextNonce
  })
}

main();
