import { NanceConfig } from './types';
import { JuiceboxHandlerV1 } from './juicebox/juiceboxHandlerV1';
import { JuiceboxHandlerV2 } from './juicebox/juiceboxHandlerV2';
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

  async buildFundingCycleData(version: string) {
    const payouts = await this.nance.proposalHandler.getPayoutsDb(version);
  }
}
