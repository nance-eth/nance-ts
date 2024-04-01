// to check if there are any proposals

import { NanceConfig } from '@nance/nance-sdk';
import { STATUS } from '../constants';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';

export const shouldSendAlert = async (space: string, config: NanceConfig) => {
  const dolt = new DoltHandler(pools[space], config.proposalIdPrefix);
  const temperatureCheckOrVotingProposals = await dolt.getProposals({
    where: `proposalStatus = "${STATUS.TEMPERATURE_CHECK}" OR proposalStatus = "${STATUS.VOTING}"`,
  });
  console.log(temperatureCheckOrVotingProposals.proposals.length);
  return temperatureCheckOrVotingProposals.proposals.length > 0;
};
