import { Nance } from '../nance';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';

// const mySafeAddress = '0x32533f602527024EBC64FEbF05F18D32105fB199';
const mySafeAddress = '0xB459e6B0a53a9401F6f4f6D31c1eDD30c1cbe3E6';

async function main() {
  const config = await getConfig();
  const nance = new Nance(config);
  const treasury = new NanceTreasury(config, nance);
  const gnosis = await GnosisHandler.initializeSafe(config.juicebox.gnosisSafeAddress, config.juicebox.network);
  const { address, data } = await treasury.encodeReconfigureFundingCyclesOf();
  const gnosisInfo = await gnosis.getGasEstimate({
    to: address,
    value: '0',
    operation: 1,
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
