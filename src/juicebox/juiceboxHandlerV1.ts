import { JsonRpcProvider } from '@ethersproject/providers';
import {
  getFundingCycles,
  getModStore
} from 'juice-sdk-v1';
import { PayoutModStructOutput, TicketModStructOutput } from 'juice-sdk-v1/dist/cjs/types/contracts/TerminalV1';
import { keys } from '../keys';
import { TEN_THOUSAND } from './interface/juiceboxMath';

const CSV_HEADING_PAYOUT = 'beneficiary,percent,preferUnstaked,lockedUntil,projectId,allocator';
const CSV_HEADING_RESERVE = 'beneficiary,percent,preferUnstaked,lockedUntil';

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

  queuedConfiguration = async () => {
    return (await getFundingCycles(
      this.provider,
      { network: this.network }
    ).queuedOf(this.projectId)).start;
  };

  // eslint-disable-next-line class-methods-use-this
  payoutDistributionsArrayPretty = (distributions: PayoutModStructOutput[]) => {
    return distributions.map((distribution: PayoutModStructOutput) => {
      return [
        distribution.beneficiary,
        Number(distribution.percent) / TEN_THOUSAND,
        distribution.preferUnstaked,
        Number(distribution.lockedUntil),
        Number(distribution.projectId),
        distribution.allocator
      ];
    });
  };

  // eslint-disable-next-line class-methods-use-this
  reserveDistributionsArrayPretty = (distributions: TicketModStructOutput[]) => {
    return distributions.map((distribution: TicketModStructOutput) => {
      return [
        distribution.beneficiary,
        Number(distribution.percent) / TEN_THOUSAND,
        distribution.preferUnstaked,
        Number(distribution.lockedUntil),
      ];
    });
  };

  async getPayoutDistribution() {
    const currentConfiguration = await this.currentConfiguration();
    const fundingDistribution = await getModStore(
      this.provider,
      { network: this.network }
    ).payoutModsOf(this.projectId, currentConfiguration);
    return fundingDistribution;
  }

  async getPayoutDistributionCSV() {
    const distributions = await this.getPayoutDistribution();
    return CSV_HEADING_PAYOUT.concat(
      '\n',
      this.payoutDistributionsArrayPretty(distributions).join('\n')
    );
  }

  async getReserveDistribution() {
    const currentConfiguration = await this.currentConfiguration();
    const reservedDistribution = await getModStore(
      this.provider,
      { network: this.network }
    ).ticketModsOf(this.projectId, currentConfiguration);
    return reservedDistribution;
  }

  async getReserveDistributionCSV() {
    const distributions = await this.getReserveDistribution();
    return CSV_HEADING_RESERVE.concat(
      '\n',
      this.reserveDistributionsArrayPretty(distributions).join('\n')
    );
  }

  async getDistributionLimit() {
    return (await getFundingCycles(
      this.provider,
      { network: this.network }
    ).currentOf(this.projectId)).target;
  }
}
