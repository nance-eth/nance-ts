import { GnosisHandler } from '../gnosisHandler';

const gnosis = new GnosisHandler('0x32533f602527024EBC64FEbF05F18D32105fB199');

async function main() {
  console.log(await gnosis.getGasEstimate({
    to: '0x4e3ef8AFCC2B52E4e704f4c8d9B7E7948F651351',
    value: '0',
    data: '',
    operation: 1,
  }));
}

main();
