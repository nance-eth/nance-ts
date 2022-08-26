import { GnosisHandler } from '../gnosisHandler';

const gnosis = new GnosisHandler('0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e');

async function main() {
  console.log(await gnosis.getGasEstimate({
    to: '0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e',
    value: '0',
    operation: 0,
  }));
}

main();
