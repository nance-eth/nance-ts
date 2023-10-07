import { JuiceboxHandlerV3 } from '../../juicebox/juiceboxHandlerV3';
import { dateToUnixTimeStamp, myProvider, unixTimeStampNow } from '../../utils';

export async function juiceboxTime(projectId: string, network = 'mainnet' as 'mainnet' | 'goerli') {
  const juicebox = new JuiceboxHandlerV3(projectId, myProvider(network), network);
  const currentConfiguration = await juicebox.currentConfiguration();
  // TODO update to read delay period from contract
  const delay = 3 * 24 * 3600;
  const nowTimestamp = unixTimeStampNow();
  const startTimestamp = currentConfiguration.start.toNumber();
  const duration = currentConfiguration.duration.toNumber();
  const currentGovernanceCycle = currentConfiguration.number.toNumber();
  const endTimestamp = (startTimestamp + duration);
  const cycleCurrentDay = Math.floor((nowTimestamp - startTimestamp) / (24 * 3600));
  const daysRemainingToSubmitReconfig = Math.floor((endTimestamp - delay - nowTimestamp) / (24 * 3600));
  return {
    currentGovernanceCycle,
    cycleCurrentDay,
    start: startTimestamp * 1000,
    end: endTimestamp * 1000,
    delay,
    daysRemainingToSubmitReconfig
  };
}
