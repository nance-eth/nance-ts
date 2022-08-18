import { JsonRpcProvider } from '@ethersproject/providers';
import {
  getJBFundingCycleStore,
  getJBController,
  getJBSplitsStore,
  getJBDirectory
} from 'juice-sdk';
import { keys } from '../keys';

const TOKEN_ETH = '0x000000000000000000000000000000000000eeee';

export class JuiceboxHandlerV2 {
  protected provider;

  constructor(
    protected projectId: string,
    protected projectIdV1 = projectId,
    protected network = 'mainnet' as 'mainnet' | 'rinkeby'
  ) {
    const RPC_HOST = (network === 'mainnet')
      ? `https://mainnet.infura.io/v3/${keys.INFURA_KEY}`
      : `https://rinkeby.infura.io/v3/${keys.INFURA_KEY}`;
    this.provider = new JsonRpcProvider(RPC_HOST);
  }

  currentConfiguration = async () => {
    return (await getJBFundingCycleStore(
      this.provider,
      { network: this.network }
    ).currentOf(this.projectId)).configuration;
  };

  async getDistribution() {
    const currentConfiguration = await this.currentConfiguration();
    const fundingDistribution = await getJBSplitsStore(this.provider, { network: this.network }).splitsOf(this.projectId, currentConfiguration, '1');
    const reservedDistribution = await getJBSplitsStore(this.provider, { network: this.network }).splitsOf(this.projectId, currentConfiguration, '2');
    return {
      fundingDistribution,
      reservedDistribution
    };
  }

  async getDistributionLimit() {
    const currentConfiguration = await this.currentConfiguration();
    const terminal = await getJBDirectory(
      this.provider,
      { network: this.network }
    ).terminalsOf(this.projectId);
    const distributionLimit = await getJBController(
      this.provider,
      { network: this.network }
    ).distributionLimitOf(
      this.projectId,
      currentConfiguration,
      terminal[0],
      TOKEN_ETH
    );
    return distributionLimit;
  }
}
