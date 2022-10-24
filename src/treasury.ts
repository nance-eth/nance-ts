/* eslint-disable prefer-promise-reject-errors */
import { JuiceboxHandlerV1 } from './juicebox/juiceboxHandlerV1';
import { JuiceboxHandlerV2 } from './juicebox/juiceboxHandlerV2';
import { JuiceboxHandlerV3 } from './juicebox/juiceboxHandlerV3';
import { BallotKey } from './juicebox/typesV2';
import { NotionHandler } from './notion/notionHandler';
import { BasicTransaction, NanceConfig } from './types';

export class NanceTreasury {
  juiceboxHandlerV1;
  juiceboxHandlerV2;
  juiceboxHandlerV3;
  provider;

  constructor(
    protected config: NanceConfig,
    protected proposalHandler: NotionHandler
  ) {
    this.juiceboxHandlerV1 = new JuiceboxHandlerV1(
      config.juicebox.projectId,
      config.juicebox.network
    );
    this.juiceboxHandlerV2 = new JuiceboxHandlerV2(
      config.juicebox.projectId,
      config.juicebox.network
    );
    this.juiceboxHandlerV3 = new JuiceboxHandlerV3(
      config.juicebox.projectId,
      config.juicebox.network as 'mainnet' | 'goerli'
    );
    this.provider = this.juiceboxHandlerV2.provider;
  }

  // async removeStalePayouts() {
  //
  // }

  async updatePayoutTableFromProposals(governanceCycle: string) {
    const approvedReccuringPayoutProposals = await this.proposalHandler.getApprovedRecurringPaymentProposals(governanceCycle);
    approvedReccuringPayoutProposals.map((payoutProposal) => {
      const payoutTitle = payoutProposal.title.toLowerCase().match(/[a-z1-9]*.eth/)?.[0] ?? payoutProposal.title;
      return this.proposalHandler.addPayoutToDb(
        payoutTitle,
        payoutProposal
      );
    });
  }

  async payoutTableToGroupedSplitsStruct(version = 'V2') {
    const payouts = await this.proposalHandler.getPayoutsDb(version);
    const reserves = await this.proposalHandler.getReserveDb(version);
    const newDistributionLimit = this.juiceboxHandlerV2.calculateNewDistributionLimit(payouts);
    const JBGroupedSplitsStruct = await this.juiceboxHandlerV2.buildJBGroupedSplitsStruct(
      newDistributionLimit,
      payouts,
      reserves
    );
    console.log(JBGroupedSplitsStruct);
    return {
      groupedSplits: JBGroupedSplitsStruct,
      newDistributionLimit
    };
  }

  async payoutTableToMods(version = 'V1') {
    const payouts = await this.proposalHandler.getPayoutsDb(version);
    const reserves = await this.proposalHandler.getReserveDb(version);
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

  async V3encodeReconfigureFundingCyclesOf(reconfigurationBallot?: BallotKey) {
    const { groupedSplits, newDistributionLimit } = await this.payoutTableToGroupedSplitsStruct();
    const encoded = await this.juiceboxHandlerV3.encodeGetReconfigureFundingCyclesOf(groupedSplits, newDistributionLimit, reconfigurationBallot);
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
    return Promise.reject(`[NANCE ERROR]: version ${version} not supported`);
  }

  async fetchPayReserveDistribution(version: string) {
    if (version === 'V1') { return this.payoutTableToMods(); }
    if (version === 'V2') { return this.payoutTableToGroupedSplitsStruct(); }
    return Promise.reject(`[NANCE ERROR]: version ${version} not supported`);
  }
}
