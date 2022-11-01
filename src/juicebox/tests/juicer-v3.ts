import { JuiceboxHandlerV3 } from '../juiceboxHandlerV3';

async function main() {
  const juice = new JuiceboxHandlerV3('37', 'goerli');
  await juice.distributeFunds();
}

main();
