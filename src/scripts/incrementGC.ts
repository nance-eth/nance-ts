import { getConfig } from '../configLoader';
import { Nance } from '../nance';

const incrementGovernanceCycle = async () => {
  const config = await getConfig();
  const nance = new Nance(config);
  nance.proposalHandler.incrementGovernanceCycle();
}

incrementGovernanceCycle();