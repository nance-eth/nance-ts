import { Nance } from '../nance';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const treasury = new NanceTreasury(config, nance);
  const gnosis = new GnosisHandler('0x32533f602527024EBC64FEbF05F18D32105fB199');
  const { address, data } = await treasury.encodeReconfigureFundingCyclesOf();
  const gnosisInfo = await gnosis.getGasEstimate({
    to: address,
    value: '0',
    operation: 1,
    data
  });
  gnosis.sendTransaction({
    safe: '0x32533f602527024EBC64FEbF05F18D32105fB199',
    to: address,
    value: 0,
    data,
    operation: 1,
    gasToken: gnosisInfo.gasToken,
    safeTxGas: Number(gnosisInfo.safeTxGas),
    baseGas: Number(gnosisInfo.baseGas),
    gasPrice: Number(gnosisInfo.gasPrice),
    refundReceiver: gnosisInfo.refundReceiver,
    nonce: 1
  })
}

main();
