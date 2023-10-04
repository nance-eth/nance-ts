import { JuiceboxHandlerV3 } from '../../juicebox/juiceboxHandlerV3';
import { myProvider, unixTimeStampNow } from '../../utils';

export async function juiceboxTime(projectId: string, network = 'mainnet' as 'mainnet' | 'goerli') {
  const juicebox = new JuiceboxHandlerV3(projectId, myProvider(network), network);
  const currentConfiguration = await juicebox.currentConfiguration();
  // TODO update to read delay period from contract
  const delay = 3 * 24 * 3600 * 1000;
  const start = currentConfiguration.start.toNumber();
  const duration = currentConfiguration.duration.toNumber();
  const end = (start + duration) * 1000;
  const remainingSeconds = (end - unixTimeStampNow()) * 1000;
  const cycleCurrentDay = new Date(remainingSeconds).getUTCDate();
  const currentGovernanceCycle = currentConfiguration.number.toNumber();
  return { currentGovernanceCycle, cycleCurrentDay, startTimestamp: start, endTimestamp: end, delay };
}
