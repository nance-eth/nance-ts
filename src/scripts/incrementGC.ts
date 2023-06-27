import { doltConfig, getConfig } from '../configLoader';
import { Nance } from '../nance';

const incrementGovernanceCycle = async () => {
  const { config } = await doltConfig('waterbox');
  const nance = new Nance(config);
  nance.dProposalHandler.incrementGovernanceCycle();
}

incrementGovernanceCycle();