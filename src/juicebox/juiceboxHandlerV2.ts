import { JsonRpcProvider } from '@ethersproject/providers';
import {
  getJBFundingCycleStore,
  getJBController,
  getJBSplitsStore,
  getJBDirectory
} from 'juice-sdk';
import { JBSplitStruct } from 'juice-sdk/dist/cjs/types/contracts/JBController';
import { ONE_BILLION } from './juiceboxMath';
import { keys } from '../keys';

const TOKEN_ETH = '0x000000000000000000000000000000000000eeee';
const CSV_HEADING = 'beneficiary,percent,preferClaimed,lockedUntil,projectId,allocator';

export class JuiceboxHandlerV2 {
  provider;

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
    return (await getJBFundingCycleStore(
      this.provider,
      { network: this.network }
    ).currentOf(this.projectId)).configuration;
  };

  queuedConfiguration = async () => {
    return (await getJBFundingCycleStore(
      this.provider,
      { network: this.network }
    ).queuedOf(this.projectId)).start;
  };

  // eslint-disable-next-line class-methods-use-this
  distributionsArrayPretty = (distributions: JBSplitStruct[]) => {
    return distributions.map((distribution: JBSplitStruct) => {
      return [
        distribution.beneficiary,
        Number(distribution.percent) / ONE_BILLION,
        distribution.preferClaimed,
        Number(distribution.lockedUntil),
        Number(distribution.projectId),
        distribution.allocator
      ];
    });
  };

  async getPayoutDistribution() {
    const currentConfiguration = await this.currentConfiguration();
    const fundingDistribution = await getJBSplitsStore(
      this.provider,
      { network: this.network }
    ).splitsOf(this.projectId, currentConfiguration, '1');
    return fundingDistribution;
  }

  async getPayoutDistributionCSV() {
    const distributions = await this.getPayoutDistribution();
    return CSV_HEADING.concat(
      '\n',
      this.distributionsArrayPretty(distributions).join('\n')
    );
  }

  async getReserveDistribution() {
    const currentConfiguration = await this.currentConfiguration();
    const reservedDistribution = await getJBSplitsStore(
      this.provider,
      { network: this.network }
    ).splitsOf(this.projectId, currentConfiguration, '2');
    return reservedDistribution;
  }

  async getReserveDistributionCSV() {
    const distributions = await this.getReserveDistribution();
    return CSV_HEADING.concat(
      '\n',
      this.distributionsArrayPretty(distributions).join('\n')
    );
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

  // async getHexEncoded(domain: BigNumberish, groupedSplits: JBGroupedSplitsStruct[]) {
  //   await getJBSplitsStore(this.provider).set(
  //     this.projectId,
  //     domain,
  //     groupedSplits
  //   );
  // }
}
