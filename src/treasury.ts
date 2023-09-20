/* eslint-disable prefer-promise-reject-errors */
import { JsonRpcProvider } from '@ethersproject/providers';
import { DoltHandler } from './dolt/doltHandler';
import { GovernanceCycle } from './dolt/schema';
import { JuiceboxHandlerV1 } from './juicebox/juiceboxHandlerV1';
import { JuiceboxHandlerV2 } from './juicebox/juiceboxHandlerV2';
import { JuiceboxHandlerV3 } from './juicebox/juiceboxHandlerV3';
import { BallotKey } from './juicebox/typesV2';
import { BasicTransaction, NanceConfig } from './types';
import { addSecondsToDate } from './utils';

export class NanceTreasury {
  juiceboxHandlerV1;
  juiceboxHandlerV2;
  juiceboxHandlerV3;
  provider;
  currentGovernanceCycle: number;

  constructor(
    protected config: NanceConfig,
    protected proposalHandler: DoltHandler,
    provider: JsonRpcProvider,
    currentCycle: number
  ) {
    this.juiceboxHandlerV1 = new JuiceboxHandlerV1(
      config.juicebox.projectId,
      config.juicebox.network as 'mainnet' | 'rinkeby'
    );
    this.juiceboxHandlerV2 = new JuiceboxHandlerV2(
      config.juicebox.projectId,
      config.juicebox.network as 'mainnet' | 'rinkeby'
    );
    this.juiceboxHandlerV3 = new JuiceboxHandlerV3(
      config.juicebox.projectId,
      provider,
      config.juicebox.network as 'mainnet' | 'goerli'
    );
    this.provider = this.juiceboxHandlerV3.provider;
    this.currentGovernanceCycle = currentCycle;
  }

  async payoutTableToGroupedSplitsStruct(version = 'V2') {
    const payouts = await this.proposalHandler.getPayoutsDb(this.currentGovernanceCycle);
    const reserves = await this.proposalHandler.getReserveDb();
    const newDistributionLimit = (version === 'V2')
      ? this.juiceboxHandlerV2.calculateNewDistributionLimit(payouts)
      : this.juiceboxHandlerV3.calculateNewDistributionLimit(payouts);
    const JBGroupedSplitsStruct = (version === 'V2')
      ? await this.juiceboxHandlerV2.buildJBGroupedSplitsStruct(
        newDistributionLimit,
        payouts,
        reserves
      )
      : await this.juiceboxHandlerV3.buildJBGroupedSplitsStruct(
        newDistributionLimit,
        payouts,
        reserves
      );
    return {
      groupedSplits: JBGroupedSplitsStruct,
      newDistributionLimit
    };
  }

  async payoutTableToMods(version = 'V1') {
    const payouts = await this.proposalHandler.getPayoutsDb(this.currentGovernanceCycle);
    const reserves = await this.proposalHandler.getReserveDb();
    const newDistributionLimit = this.juiceboxHandlerV1.calculateNewDistributionLimit(payouts);
    const { payoutMods, ticketMods } = await this.juiceboxHandlerV1.buildModsStruct(
      newDistributionLimit,
      payouts,
      reserves
    );
    return {
      payoutMods,
      ticketMods,
      newDistributionLimit
    };
  }

  async V3encodeReconfigureFundingCyclesOf(memo?: string, reconfigurationBallot?: BallotKey) {
    const { groupedSplits, newDistributionLimit } = await this.payoutTableToGroupedSplitsStruct('V3');
    const encoded = await this.juiceboxHandlerV3.encodeGetReconfigureFundingCyclesOf(groupedSplits, newDistributionLimit, memo, reconfigurationBallot);
    return encoded;
  }

  async V2encodeReconfigureFundingCyclesOf(memo?: string, reconfigurationBallot?: BallotKey) {
    const { groupedSplits, newDistributionLimit } = await this.payoutTableToGroupedSplitsStruct();
    const encoded = await this.juiceboxHandlerV2.encodeGetReconfigureFundingCyclesOf(groupedSplits, newDistributionLimit, memo, reconfigurationBallot);
    return encoded;
  }

  async V1encodeReconfigureFundingCyclesOf(reconfigurationBallot?: BallotKey) {
    const { payoutMods, ticketMods, newDistributionLimit } = await this.payoutTableToMods();
    const encoded = await this.juiceboxHandlerV1.encodeGetReconfigureFundingCyclesOf(payoutMods, ticketMods, newDistributionLimit, reconfigurationBallot);
    return encoded;
  }

  async fetchReconfiguration(version: string, memo?: string): Promise<BasicTransaction> {
    if (version === 'V1') { return this.V1encodeReconfigureFundingCyclesOf(); }
    if (version === 'V2') { return this.V2encodeReconfigureFundingCyclesOf(memo); }
    if (version === 'V3') { return this.V3encodeReconfigureFundingCyclesOf(memo); }
    return Promise.reject(`[NANCE ERROR]: version ${version} not supported`);
  }

  async fetchPayReserveDistribution(version: string) {
    if (version === 'V1') { return this.payoutTableToMods(); }
    if (version === 'V2') { return this.payoutTableToGroupedSplitsStruct(); }
    if (version === 'V3') { return this.payoutTableToGroupedSplitsStruct('V3'); }
    return Promise.reject(`[NANCE ERROR]: version ${version} not supported`);
  }

  async getQueuedConfiguration(version: string) {
    if (version === 'V2') { return this.juiceboxHandlerV2.queuedConfiguration(); }
    if (version === 'V3') { return this.juiceboxHandlerV3.queuedConfiguration(); }
    return Promise.reject(`[NANCE ERROR]: version ${version} not supported`);
  }

  async getCurrentConfiguration(version: string) {
    if (version === 'V2') { return this.juiceboxHandlerV2.currentConfiguration(); }
    if (version === 'V3') { return this.juiceboxHandlerV3.currentConfiguration(); }
    return Promise.reject(`[NANCE ERROR]: version ${version} not supported`);
  }

  async getCycleInformation(): Promise<GovernanceCycle> {
    const { number: numberV2 } = await this.getQueuedConfiguration('V2');
    const { number: numberV3, start: startV3, duration: durationV3 } = await this.getQueuedConfiguration('V3');
    const startDatetime = addSecondsToDate(new Date(startV3.toNumber() * 1000), durationV3.toNumber());
    const cycleNumber = this.currentGovernanceCycle + 1;
    const governance: GovernanceCycle = {
      cycleNumber,
      startDatetime,
      endDatetime: addSecondsToDate(startDatetime, durationV3.toNumber()),
      jbV1FundingCycle: cycleNumber,
      jbV2FundingCycle: numberV2.toNumber() + 1,
      jbV3FundingCycle: numberV3.toNumber() + 1,
      acceptingProposals: true
    };
    return governance;
  }
}
