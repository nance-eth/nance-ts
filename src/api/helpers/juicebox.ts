import { JuiceboxHandlerV3 } from '../../juicebox/juiceboxHandlerV3';
import { myProvider, secondsToDayHoursMinutes, unixTimeStampNow } from '../../utils';

export async function juiceboxTime(projectId: string, network = 'mainnet' as 'mainnet' | 'goerli') {
  const juicebox = new JuiceboxHandlerV3(projectId, myProvider(network), network);
  const currentConfiguration = await juicebox.currentConfiguration();
  const start = currentConfiguration.start.toNumber();
  const duration = currentConfiguration.duration.toNumber();
  const end = start + duration;
  const remainingSeconds = end - unixTimeStampNow();
  const remainingDHM = secondsToDayHoursMinutes(remainingSeconds);
  const currentCycle = currentConfiguration.number.toString();
  const currentDay = (secondsToDayHoursMinutes(duration - remainingSeconds).days).toString();
  return { currentCycle, currentDay, remainingDHM, startTimestamp: start, endTimestamp: end };
}
