import { JuiceboxHandlerV1 } from './juicebox/juiceboxHandlerV1';
import { JuiceboxHandlerV2 } from './juicebox/juiceboxHandlerV2';
import { JuiceboxHandlerV3 } from './juicebox/juiceboxHandlerV3';
import { BallotKey } from './juicebox/typesV2';
import { Nance } from './nance';

export class NanceTreasury {
  juiceboxHandlerV1;
  juiceboxHandlerV2;
  juiceboxHandlerV3;
  provider;

  constructor(
    protected nance: Nance
  ) {
    this.juiceboxHandlerV1 = new JuiceboxHandlerV1(
      nance.config.juicebox.projectId,
      nance.config.juicebox.network
    );
    this.juiceboxHandlerV2 = new JuiceboxHandlerV2(
      nance.config.juicebox.projectId,
      nance.config.juicebox.network
    );
    this.juiceboxHandlerV3 = new JuiceboxHandlerV3(
      nance.config.juicebox.projectId,
      'mainnet'
    );
    this.provider = this.juiceboxHandlerV2.provider;
  }

  // async removeStalePayouts() {
  //
  // }

  async updatePayoutTableFromProposals(governanceCycle: string) {
    const approvedReccuringPayoutProposals = await this.nance.proposalHandler.getApprovedRecurringPaymentProposals(governanceCycle);
    approvedReccuringPayoutProposals.map((payoutProposal) => {
      const payoutTitle = payoutProposal.title.toLowerCase().match(/[a-z1-9]*.eth/)?.[0] ?? payoutProposal.title;
      return this.nance.proposalHandler.addPayoutToDb(
        payoutTitle,
        payoutProposal
      );
    });
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
    console.log(JBGroupedSplitsStruct);
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

  async encodeReconfigureFundingCyclesOfV3(reconfigurationBallot?: BallotKey) {
    const { groupedSplits, newDistributionLimit } = await this.payoutTableToGroupedSplitsStruct('V2');
    const encoded = await this.juiceboxHandlerV3.encodeGetReconfigureFundingCyclesOf(groupedSplits, 0, reconfigurationBallot);
    return encoded;
  }
}
