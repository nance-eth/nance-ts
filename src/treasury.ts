/* eslint-disable prefer-promise-reject-errors */
import { JsonRpcProvider } from '@ethersproject/providers';
import { DoltHandler } from './dolt/doltHandler';
import { JuiceboxHandlerV3 } from './juicebox/juiceboxHandlerV3';
import { BallotKey } from './juicebox/typesV3';
import { BasicTransaction, NanceConfig } from './types';

export class NanceTreasury {
  juiceboxHandlerV3;
  provider;
  currentGovernanceCycle: number;

  constructor(
    protected config: NanceConfig,
    protected proposalHandler: DoltHandler,
    provider: JsonRpcProvider,
    currentCycle: number
  ) {
    this.juiceboxHandlerV3 = new JuiceboxHandlerV3(
      config.juicebox.projectId,
      provider,
      config.juicebox.network as 'mainnet' | 'goerli'
    );
    this.provider = this.juiceboxHandlerV3.provider;
    this.currentGovernanceCycle = currentCycle;
  }

  async payoutTableToGroupedSplitsStruct() {
    const payouts = await this.proposalHandler.getPayoutsDb(this.currentGovernanceCycle);
    const reserves = await this.proposalHandler.getReserveDb();
    const newDistributionLimit = this.juiceboxHandlerV3.calculateNewDistributionLimit(payouts);
    const JBGroupedSplitsStruct = await this.juiceboxHandlerV3.buildJBGroupedSplitsStruct(
      newDistributionLimit,
      payouts,
      reserves
    );
    return {
      groupedSplits: JBGroupedSplitsStruct,
      newDistributionLimit
    };
  }

  async V3encodeReconfigureFundingCyclesOf(memo?: string, reconfigurationBallot?: BallotKey) {
    const { groupedSplits, newDistributionLimit } = await this.payoutTableToGroupedSplitsStruct();
    const encoded = await this.juiceboxHandlerV3.encodeGetReconfigureFundingCyclesOf(groupedSplits, newDistributionLimit, memo, reconfigurationBallot);
    return encoded;
  }

  async fetchReconfiguration(version: string, memo?: string): Promise<BasicTransaction> {
    return this.V3encodeReconfigureFundingCyclesOf(memo);
  }
}
