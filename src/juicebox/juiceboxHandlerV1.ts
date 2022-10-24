import { JsonRpcProvider } from '@ethersproject/providers';
import {
  getFundingCycles,
  getModStore,
  getProjects,
  getTicketBooth,
  getTerminalV1
} from 'juice-sdk-v1';
import {
  PayoutModStruct,
  TicketModStruct
} from 'juice-sdk-v1/dist/cjs/types/contracts/TerminalV1';
import {
  BallotKey,
  ConfigureFundingCyclesOfData,
  getFundingCyclePropertiesStruct,
  getFundingCycleMetadataStruct,
  reconfigurationBallotAddresses,
  PayoutAndTickets
} from './typesV1';
import { Payout, Reserve, BasicTransaction } from '../types';
import { keys } from '../keys';
import { TEN_THOUSAND } from './juiceboxMath';

const V1Fee = 0.025; // 2.5% = 0.025
const PROJECT_PAYOUT_PREFIX = 'V1:';
const DISTRIBUTION_CURRENCY_USD = 1;
const DISTRIBUTION_CURRENCY_ETH = 0;
const DEFAULT_PREFER_UNSTAKED = false;
const DEFAULT_LOCKED_UNTIL = 0;
const DEFAULT_ALLOCATOR = '0x0000000000000000000000000000000000000000';
const DEFAULT_PROJECT_ID = 0;

const CSV_HEADING_PAYOUT = 'beneficiary,percent,preferUnstaked,lockedUntil,projectId,allocator';
const CSV_HEADING_RESERVE = 'beneficiary,percent,preferUnstaked,lockedUntil';

export class JuiceboxHandlerV1 {
  protected provider;
  ModStore;
  Projects;
  TicketBooth;
  TerminalV1;
  FundingCyclesStore;
  ConfigurationBallotAddresses;

  constructor(
    protected projectId: string,
    protected network = 'mainnet' as 'mainnet' | 'rinkeby'
  ) {
    const RPC_HOST = (network === 'mainnet')
      ? `https://mainnet.infura.io/v3/${keys.INFURA_KEY}`
      : `https://rinkeby.infura.io/v3/${keys.INFURA_KEY}`;
    this.provider = new JsonRpcProvider(RPC_HOST);
    this.ModStore = getModStore(this.provider, { network: this.network });
    this.Projects = getProjects(this.provider, { network: this.network });
    this.TicketBooth = getTicketBooth(this.provider, { network: this.network });
    this.TerminalV1 = getTerminalV1(this.provider, { network: this.network });
    this.ConfigurationBallotAddresses = reconfigurationBallotAddresses[this.network];
    this.FundingCyclesStore = getFundingCycles(this.provider, { network: this.network });
  }

  // eslint-disable-next-line class-methods-use-this
  payoutDistributionsArrayPretty = (distributions: PayoutModStruct[]) => {
    return distributions.map((distribution: PayoutModStruct) => {
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
  reserveDistributionsArrayPretty = (distributions: TicketModStruct[]) => {
    return distributions.map((distribution: TicketModStruct) => {
      return [
        distribution.beneficiary,
        Number(distribution.percent) / TEN_THOUSAND,
        distribution.preferUnstaked,
        Number(distribution.lockedUntil),
      ];
    });
  };

  async getProjectOwner() {
    return getProjects(this.provider, { network: this.network }).ownerOf(this.projectId);
  }

  // eslint-disable-next-line class-methods-use-this
  withFees(amount: number) {
    return amount * (1 + V1Fee);
  }

  // eslint-disable-next-line class-methods-use-this
  withOutFees(amount: number) {
    return Math.round(amount / (1 + V1Fee));
  }

  // eslint-disable-next-line class-methods-use-this
  calculateNewDistributionLimit(distrubutionPayouts: Payout[]) {
    return Math.round(distrubutionPayouts.reduce((total, payout) => {
      return total + this.withFees(payout.amountUSD);
    }, 0));
  }

  async buildModsStruct(distributionLimit: number, distributionPayouts: Payout[], distributionReserved: Reserve[]): Promise<PayoutAndTickets> {
    const owner = await this.getProjectOwner();
    const distributionPayoutModStruct = distributionPayouts.map((payout): PayoutModStruct => {
      const projectPayout = (payout.address.includes(PROJECT_PAYOUT_PREFIX)) ? payout.address.split(PROJECT_PAYOUT_PREFIX)[1] : undefined;
      return {
        preferUnstaked: DEFAULT_PREFER_UNSTAKED,
        percent: Math.floor((payout.amountUSD / this.withOutFees(distributionLimit)) * TEN_THOUSAND),
        lockedUntil: DEFAULT_LOCKED_UNTIL,
        beneficiary: (projectPayout) ? owner : payout.address,
        allocator: DEFAULT_ALLOCATOR,
        projectId: projectPayout || DEFAULT_PROJECT_ID
      };
    });
    const distributionTicketModStruct = distributionReserved.map((reserve): TicketModStruct => {
      return {
        preferUnstaked: DEFAULT_PREFER_UNSTAKED,
        percent: reserve.percentage * 100,
        lockedUntil: DEFAULT_LOCKED_UNTIL,
        beneficiary: reserve.address
      };
    });
    return {
      payoutMods: distributionPayoutModStruct,
      ticketMods: distributionTicketModStruct
    };
  }

  async encodeGetReconfigureFundingCyclesOf(payoutMods: PayoutModStruct[], ticketMods: TicketModStruct[], distributionLimit: number, reconfigurationBallot?: BallotKey): Promise<BasicTransaction> {
    const fundingCycle = await this.FundingCyclesStore.queuedOf(this.projectId);
    const configureFundingCycleProperties = getFundingCyclePropertiesStruct(
      fundingCycle,
      distributionLimit,
      DISTRIBUTION_CURRENCY_USD,
      // use queued ballot if none passed in
      (reconfigurationBallot) ? this.ConfigurationBallotAddresses[reconfigurationBallot] : fundingCycle.ballot
    );
    const configureFundingCycleMetadata = getFundingCycleMetadataStruct(fundingCycle.metadata);
    const configureFundingCyclesOfData: ConfigureFundingCyclesOfData = [
      this.projectId,
      configureFundingCycleProperties,
      configureFundingCycleMetadata,
      payoutMods,
      ticketMods,
    ];
    const encodedConfigure = this.TerminalV1.interface.encodeFunctionData(
      'configure',
      configureFundingCyclesOfData
    );
    // console.dir(this.TerminalV1.interface.decodeFunctionData(
    //   'configure',
    //   encodedConfigure
    // ), { depth: null });
    return { address: this.TerminalV1.address, bytes: encodedConfigure };
  }
}
