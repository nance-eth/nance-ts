import { JuiceboxHandlerV3 } from '../../juicebox/juiceboxHandlerV3';
import { myProvider, secondsToDayHoursMinutes, unixTimeStampNow } from '../../utils';
import { EVENTS } from './auto/constants';

export async function juiceboxTime(projectId: string, network = 'mainnet' as 'mainnet' | 'goerli') {
  const juicebox = new JuiceboxHandlerV3(projectId, myProvider(network), network);
  const currentConfiguration = await juicebox.currentConfiguration();
  // TODO update to read delay period from contract
  const delay = 3 * 24 * 3600;
  const start = currentConfiguration.start.toNumber();
  const duration = currentConfiguration.duration.toNumber();
  const end = start + duration - delay;
  const remainingSeconds = end - unixTimeStampNow();
  const cycleCurrentDay = secondsToDayHoursMinutes(remainingSeconds).days;
  const currentGovernanceCycle = currentConfiguration.number.toNumber();
  return { currentGovernanceCycle, cycleCurrentDay, startTimestamp: start * 1000, endTimestamp: end * 1000, currentEventTitle: EVENTS.NULL };
}
