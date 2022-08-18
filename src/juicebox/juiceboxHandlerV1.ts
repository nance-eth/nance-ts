import { JsonRpcProvider } from '@ethersproject/providers';
import {
  getFundingCycles,
  getModStore
} from 'juice-sdk-v1';
import { keys } from '../keys';

const TOKEN_ETH = '0x000000000000000000000000000000000000eeee';

export class JuiceboxHandlerV1 {
  protected provider;

  constructor(
    protected projectId: string,
    protected network = 'mainnet' as 'mainnet' | 'rinkeby'
  ) {
    const RPC_HOST = (network === 'mainnet')
      ? `https://mainnet.infura.io/v3/${keys.INFURA_KEY}`
      : `https://rinkeby.infura.io/v3/${keys.INFURA_KEY}`;
    this.provider = new JsonRpcProvider(RPC_HOST);
  }

  currentConfiguration = async () => {
    return (await getFundingCycles(
      this.provider,
      { network: this.network }
    ).currentOf(this.projectId)).configured;
  };

  async getDistribution() {
    const currentConfiguration = await this.currentConfiguration();
    const fundingDistribution = await getModStore(
      this.provider,
      { network: this.network }
    ).payoutModsOf(this.projectId, currentConfiguration);
    const reservedDistribution = await getModStore(
      this.provider,
      { network: this.network }
    ).ticketModsOf(this.projectId, currentConfiguration);
    return {
      fundingDistribution,
      reservedDistribution
    };
  }

  async getDistributionLimit() {
    return (await getFundingCycles(
      this.provider,
      { network: this.network }
    ).currentOf(this.projectId)).target;
  }
}
