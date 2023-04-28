import { ticketBoothTransfer } from '../transactionHandler';

function main() {
  const holder = '0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e';
  const projectId = '1';
  const amount = '1000000000000000000';
  const receipients = ['0x823b92d6a4b2AED4b15675c7917c9f922ea8ADAD', '0x25910143C255828F623786f46fe9A8941B7983bB'];
  receipients.forEach((receipient) => {
    const output = ticketBoothTransfer(holder, projectId, amount, receipient);
    console.log(output);
  });
}

main();
