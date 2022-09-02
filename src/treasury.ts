import { NanceConfig } from './types';
import { JuiceboxHandlerV1 } from './juicebox/juiceboxHandlerV1';
import { JuiceboxHandlerV2 } from './juicebox/juiceboxHandlerV2';
import { BallotKey } from './juicebox/typesV2';
import { Nance } from './nance';

export class NanceTreasury {
  juiceboxHandlerV1;
  juiceboxHandlerV2;

  constructor(
    protected config: NanceConfig,
    protected nance: Nance
  ) {
    this.juiceboxHandlerV1 = new JuiceboxHandlerV1(
      config.juicebox.projectId,
      config.juicebox.network
    );
    this.juiceboxHandlerV2 = new JuiceboxHandlerV2(
      config.juicebox.projectId,
      config.juicebox.network
    );
  }

  async payoutTableToGroupedSplitsStruct(version: string) {
    const payouts = await this.nance.proposalHandler.getPayoutsDb(version);
    const reserves = await this.nance.proposalHandler.getReserveDb(version);
    const newDistributionLimit = this.juiceboxHandlerV2.calculateNewDistributionLimit(payouts);
    const JBGroupedSplitsStruct = await this.juiceboxHandlerV2.buildJBGroupedSplitsStruct(
      newDistributionLimit,
      payouts,
      reserves
    );
    return {
      groupedSplits: JBGroupedSplitsStruct,
      newDistributionLimit
    };
  }

  async encodeReconfigureFundingCyclesOf(reconfigurationBallot?: BallotKey) {
    const { groupedSplits, newDistributionLimit } = await this.payoutTableToGroupedSplitsStruct('V2');
    const encoded = await this.juiceboxHandlerV2.encodeGetReconfigureFundingCyclesOf(groupedSplits, newDistributionLimit, reconfigurationBallot);
    return encoded;
  }
}
