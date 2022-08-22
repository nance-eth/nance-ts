import { NanceConfig } from './types';
import { JuiceboxHandlerV1 } from './juicebox/juiceboxHandlerV1';
import { JuiceboxHandlerV2 } from './juicebox/juiceboxHandlerV2';
import { Nance } from './nance';

const JB_FEE = 0.025;

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

  async buildFundingCycleData(version: string) {
    const payouts = await this.nance.proposalHandler.getPayoutsDb(version);
    const targetFundingTotal = payouts.reduce((total, payout) => {
      // dont include fee if payout is to another project
      return (payout.address.includes('V'))
        ? total + payout.amountUSD
        : total + (payout.amountUSD * (1 + JB_FEE));
    }, 0);
    return targetFundingTotal;
  }
}
