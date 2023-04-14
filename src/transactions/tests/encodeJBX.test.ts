import { encodeERC20Transfer } from '../transactionHandler';

function main() {
  const to = '0x823b92d6a4b2AED4b15675c7917c9f922ea8ADAD';
  const value = '1000000000000000000';
  const token = 'DAI';
  const output = encodeERC20Transfer(to, value, token);
  console.log(output);
}

main();
