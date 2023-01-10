import { JsonRpcProvider } from '@ethersproject/providers';
import {
  getJBFundingCycleStore,
  getJBController,
  getJBSplitsStore,
  getJBDirectory,
  getJBProjects,
  getJB3DayReconfigurationBufferBallot,
  getJB7DayReconfigurationBufferBallot,
  getJBETHPaymentTerminal
} from 'juice-sdk';
import { BigNumber } from '@ethersproject/bignumber';
import { JBSplitStruct, JBGroupedSplitsStruct } from 'juice-sdk/dist/cjs/types/contracts/JBController';
import { ONE_BILLION, ONE_MILLION } from './juiceboxMath';
import {
  getJBFundingCycleDataStruct,
  getJBFundingCycleMetadataStruct,
  ReconfigureFundingCyclesOfData,
  getJBFundAccessConstraintsStruct,
  ReconfigurationBallotAddresses,
  BallotKey,
} from './typesV2';
import { Reserve, BasicTransaction } from '../types';
import { SQLPayout, SQLReserve } from '../dolt/schema';
import { keys } from '../keys';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const TOKEN_ETH = '0x000000000000000000000000000000000000EEEe';
const DEFAULT_MUST_START_AT_OR_AFTER = '1';
const DEFAULT_WEIGHT = 0;
const DISTRIBUTION_CURRENCY_USD = 2;
const DISTRIBUTION_CURRENCY_ETH = 1;
const GROUP_ETH_PAYOUT = 1;
const GROUP_RESERVED_TOKENS = 2;
const DEFAULT_PREFER_CLAIMED = false;
const DEFAULT_PREFER_ADD_BALANCE = false;
const DEFAULT_LOCKED_UNTIL = 0;
const DEFAULT_ALLOCATOR = '0x0000000000000000000000000000000000000000';
const DEFAULT_OVERFLOW_ALLOWANCE = 0;
const DEFAULT_OVERFLOW_ALLOWANCE_CURRENCY = 0;
const DEFAULT_PROJECT_ID = 0;
const DEFAULT_MEMO = 'yours truly ~nance~';

const CSV_HEADING = 'beneficiary,percent,preferClaimed,lockedUntil,projectId,allocator';

export class JuiceboxHandlerV2 {
  provider;
  JBSplitsStore;
  JBController;
  JBReconfigurationBallotAddresses;
  JBETHPaymentTerminal;

  constructor(
    protected projectId: string,
    protected network = 'mainnet' as 'mainnet' | 'rinkeby'
  ) {
    const RPC_HOST = `https://${this.network}.infura.io/v3/${keys.INFURA_KEY}`;
    this.provider = new JsonRpcProvider(RPC_HOST);
    this.JBSplitsStore = getJBSplitsStore(this.provider, { network: this.network });
    this.JBController = getJBController(this.provider, { network: this.network });
    this.JBReconfigurationBallotAddresses = {
      0: ZERO_ADDRESS,
      3: getJB3DayReconfigurationBufferBallot(this.provider, { network: this.network }).address,
      7: getJB7DayReconfigurationBufferBallot(this.provider, { network: this.network }).address
    } as ReconfigurationBallotAddresses;
    this.JBETHPaymentTerminal = getJBETHPaymentTerminal(this.provider, { network: this.network });
  }

  currentConfiguration = async () => {
    return getJBFundingCycleStore(
      this.provider,
      { network: this.network }
    ).currentOf(this.projectId);
  };

  queuedConfiguration = async () => {
    return getJBFundingCycleStore(
      this.provider,
      { network: this.network }
    ).queuedOf(this.projectId);
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
    const currentConfiguration = (await this.currentConfiguration()).configuration;
    const fundingDistribution = await getJBSplitsStore(
      this.provider,
      { network: this.network }
    ).splitsOf(this.projectId, currentConfiguration, GROUP_ETH_PAYOUT);
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
    const currentConfiguration = (await this.currentConfiguration()).configuration;
    const reservedDistribution = await getJBSplitsStore(
      this.provider,
      { network: this.network }
    ).splitsOf(this.projectId, currentConfiguration, GROUP_RESERVED_TOKENS);
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
    const currentConfiguration = (await this.currentConfiguration()).configuration;
    const terminal = await getJBDirectory(this.provider, { network: this.network }).terminalsOf(this.projectId);
    const distributionLimit = await this.JBController.distributionLimitOf(
      this.projectId,
      currentConfiguration,
      terminal[0],
      TOKEN_ETH
    );
    return distributionLimit;
  }

  async getProjectOwner() {
    return getJBProjects(this.provider, { network: this.network }).ownerOf(this.projectId);
  }

  async getSetDistributionHexEncoded(
    params: any[],
    projectId = this.projectId,
    domain = 0
  ) {
    const configuration = (domain === 0) ? (await this.queuedConfiguration()).start : domain;
    console.log(configuration);
    return this.JBSplitsStore.interface.encodeFunctionData(
      'set',
      [
        BigNumber.from(projectId),
        BigNumber.from(configuration),
        params
      ]
    );
  }

  // eslint-disable-next-line class-methods-use-this
  calculateNewDistributionLimit(distrubutionPayouts: SQLPayout[]) {
    return distrubutionPayouts.reduce((total, payout) => {
      return total + payout.amount;
    }, 0);
  }

  async buildJBGroupedSplitsStruct(
    distributionLimit: number,
    distributionPayouts: SQLPayout[],
    distributionReserved: SQLReserve[]
  ): Promise<JBGroupedSplitsStruct[]> {
    const owner = await this.getProjectOwner();
    let runningTotal = 0;
    const percentageBasedPayouts = distributionPayouts.some((payout) => { return payout.currency === 'percent'; });
    const distrubutionPayoutsJBSplitStruct = distributionPayouts.map((payout): JBSplitStruct => {
      let percent = (percentageBasedPayouts) ? payout.amount * ONE_MILLION * 10 : Math.round((payout.amount / distributionLimit) * ONE_BILLION);
      runningTotal += percent;
      if (runningTotal > ONE_BILLION) percent -= 1; // overflow hack
      if (runningTotal === ONE_BILLION - 1) percent += 1; // overflow hack
      return {
        preferClaimed: DEFAULT_PREFER_CLAIMED,
        preferAddToBalance: DEFAULT_PREFER_ADD_BALANCE,
        percent,
        projectId: payout.payProject || DEFAULT_PROJECT_ID,
        beneficiary: payout.payAddress || owner,
        lockedUntil: DEFAULT_LOCKED_UNTIL,
        allocator: payout.payAllocator || DEFAULT_ALLOCATOR
      };
    });
    const distrubutionReservedJBSplitStruct = distributionReserved.map((reserve): JBSplitStruct => {
      return {
        preferClaimed: DEFAULT_PREFER_CLAIMED,
        preferAddToBalance: DEFAULT_PREFER_ADD_BALANCE,
        percent: reserve.reservePercentage,
        projectId: DEFAULT_PROJECT_ID,
        beneficiary: reserve.reserveAddress,
        lockedUntil: reserve.lockedUntil || DEFAULT_LOCKED_UNTIL,
        allocator: DEFAULT_ALLOCATOR
      };
    });
    return [
      {
        group: GROUP_ETH_PAYOUT,
        splits: distrubutionPayoutsJBSplitStruct
      },
      {
        group: GROUP_RESERVED_TOKENS,
        splits: distrubutionReservedJBSplitStruct
      }
    ];
  }

  async encodeGetReconfigureFundingCyclesOf(groupedSplits: JBGroupedSplitsStruct[], distributionLimit: number, memo = DEFAULT_MEMO, reconfigurationBallot?: BallotKey): Promise<BasicTransaction> {
    const { fundingCycle, metadata } = await this.JBController.queuedFundingCycleOf(this.projectId);
    const reconfigFundingCycleData = getJBFundingCycleDataStruct(
      fundingCycle,
      BigNumber.from(DEFAULT_WEIGHT),
      // use queued ballot if none passed in
      (reconfigurationBallot) ? this.JBReconfigurationBallotAddresses[reconfigurationBallot] : fundingCycle.ballot
    );
    const reconfigFundingCycleMetaData = getJBFundingCycleMetadataStruct(metadata);
    const fundAccessConstraintsData = getJBFundAccessConstraintsStruct(
      this.JBETHPaymentTerminal.address,
      TOKEN_ETH,
      distributionLimit,
      DISTRIBUTION_CURRENCY_USD,
      DEFAULT_OVERFLOW_ALLOWANCE,
      DEFAULT_OVERFLOW_ALLOWANCE_CURRENCY
    );
    const mustStartAtOrAfter = DEFAULT_MUST_START_AT_OR_AFTER;
    const reconfigureFundingCyclesOfData: ReconfigureFundingCyclesOfData = [
      this.projectId,
      reconfigFundingCycleData,
      reconfigFundingCycleMetaData,
      mustStartAtOrAfter,
      groupedSplits,
      fundAccessConstraintsData,
      memo
    ];
    const encodedReconfiguration = this.JBController.interface.encodeFunctionData(
      'reconfigureFundingCyclesOf',
      reconfigureFundingCyclesOfData
    );
    // console.dir(this.JBController.interface.decodeFunctionData(
    //   'reconfigureFundingCyclesOf',
    //   encodedReconfiguration
    // ), { depth: null });
    return { address: this.JBController.address, bytes: encodedReconfiguration };
  }
}
