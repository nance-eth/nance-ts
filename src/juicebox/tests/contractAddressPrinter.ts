import { myProvider } from '../../utils';
import { JuiceboxHandlerV3 } from '../juiceboxHandlerV3';

function main() {
  const juice = new JuiceboxHandlerV3('1', myProvider('mainnet'));
  console.log(`payment terminal: ${juice.JBETHPaymentTerminal.address}`);
  console.log(`controller: ${juice.JBController.address}`);
}

main();
