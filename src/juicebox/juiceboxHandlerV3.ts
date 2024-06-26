import { JsonRpcProvider } from '@ethersproject/providers';
import { ContractTransaction, ethers, Wallet } from 'ethers';
import { Logger } from 'ethers/lib/utils';
import {
  getJBFundingCycleStore,
  getJBController3_1 as getJBController,
  getJBSplitsStore,
  getJBDirectory,
  getJBProjects,
  getJB3DayReconfigurationBufferBallot,
  getJB7DayReconfigurationBufferBallot,
  getJBETHPaymentTerminal,
  getJBETHPaymentTerminal3_1,
  getJBETHPaymentTerminal3_1_1,
  getJBETHPaymentTerminal3_1_2,
  getJBFundAccessConstraintsStore
} from '@jigglyjams/juice-sdk-v3';
import { BigNumber } from '@ethersproject/bignumber';
import { JBSplitStruct, JBGroupedSplitsStruct } from '@jigglyjams/juice-sdk-v3/dist/cjs/types/contracts/JBController';
import { SQLPayout, SQLReserve } from '@nance/nance-sdk';
import { ONE_BILLION } from './juiceboxMath';
import {
  getJBFundingCycleDataStruct,
  getJBFundingCycleMetadataStruct,
  ReconfigureFundingCyclesOfData,
  DistributePayoutsOfData,
  getJBFundAccessConstraintsStruct,
  ReconfigurationBallotAddresses,
  BallotKey,
  JBETHPaymentTerminal3_1,
  JBETHPaymentTerminal3_1_1,
  JBETHPaymentTerminal3_1_2,
} from './typesV3';
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
ethers.utils.Logger.setLogLevel(Logger.levels.ERROR);

export class JuiceboxHandlerV3 {
  provider;
  wallet;
  JBSplitsStore;
  JBController;
  JBReconfigurationBallotAddresses;
  JBETHPaymentTerminal: any;
  JBFundAccessConstraintsStore;

  constructor(
    protected projectId: string,
    provider: JsonRpcProvider,
    protected network = 'mainnet' as 'mainnet' | 'goerli',
  ) {
    this.provider = provider;
    this.wallet = (keys.PRIVATE_KEY) ? new Wallet(keys.PRIVATE_KEY, this.provider) : new Wallet(ethers.Wallet.createRandom());
    this.JBSplitsStore = getJBSplitsStore(this.provider, { network: this.network });
    this.JBController = getJBController(this.provider, { network: this.network });
    this.JBReconfigurationBallotAddresses = {
      0: ZERO_ADDRESS,
      3: getJB3DayReconfigurationBufferBallot(this.provider, { network: this.network }).address,
      7: getJB7DayReconfigurationBufferBallot(this.provider, { network: this.network }).address
    } as ReconfigurationBallotAddresses;
    this.JBFundAccessConstraintsStore = getJBFundAccessConstraintsStore(this.provider, { network: this.network });
  }

  fetchCurrentTerminal = async () => {
    const directory = getJBDirectory(this.provider, { network: this.network });
    const terminal = (await directory.terminalsOf(this.projectId))[0];
    if (terminal === JBETHPaymentTerminal3_1) this.JBETHPaymentTerminal = getJBETHPaymentTerminal(this.provider, { network: this.network });
    if (terminal === JBETHPaymentTerminal3_1_1) this.JBETHPaymentTerminal = getJBETHPaymentTerminal3_1_1(this.provider, { network: this.network });
    if (terminal === JBETHPaymentTerminal3_1_2) this.JBETHPaymentTerminal = getJBETHPaymentTerminal3_1_2(this.provider, { network: this.network });
  };

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
    const distributionLimit = await this.JBFundAccessConstraintsStore.distributionLimitOf(
      this.projectId,
      currentConfiguration,
      terminal[0],
      TOKEN_ETH
    );
    return distributionLimit;
  }

  async getQueuedDistributionLimit() {
    const queuedConfiguration = (await this.queuedConfiguration()).configuration;
    const terminal = await getJBDirectory(this.provider, { network: this.network }).terminalsOf(this.projectId);
    const distributionLimit = await this.JBFundAccessConstraintsStore.distributionLimitOf(
      this.projectId,
      queuedConfiguration,
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
    distributionReserved: SQLReserve
  ): Promise<JBGroupedSplitsStruct[]> {
    const owner = await this.getProjectOwner();
    const percentageBasedPayouts = distributionPayouts.some((payout) => { return payout.currency === 'percent'; });
    const distrubutionPayoutsJBSplitStruct = distributionPayouts.map((payout): JBSplitStruct => {
      const percent = (percentageBasedPayouts) ? payout.amount * ONE_BILLION : BigNumber.from(payout.amount).mul(BigNumber.from(ONE_BILLION)).div(distributionLimit);
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
    const distrubutionReservedJBSplitStruct = distributionReserved.splits.map((reserve): JBSplitStruct => {
      return {
        preferClaimed: reserve.preferClaimed || DEFAULT_PREFER_CLAIMED,
        preferAddToBalance: reserve.preferAddToBalance || DEFAULT_PREFER_ADD_BALANCE,
        percent: reserve.percent,
        projectId: reserve.projectId || DEFAULT_PROJECT_ID,
        beneficiary: reserve.beneficiary || owner,
        lockedUntil: reserve.lockedUntil || DEFAULT_LOCKED_UNTIL,
        allocator: reserve.allocator || DEFAULT_ALLOCATOR
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

  async encodeGetReconfigureFundingCyclesOf(groupedSplits: JBGroupedSplitsStruct[], distributionLimit: number, memo = DEFAULT_MEMO, reconfigurationBallot?: BallotKey) {
    const { fundingCycle, metadata } = await this.JBController.queuedFundingCycleOf(this.projectId);
    await this.fetchCurrentTerminal().catch((err) => { console.log(err); });
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
    // return { address: this.JBController.address, bytes: encodedReconfiguration };

    return { address: this.JBController.address, bytes: encodedReconfiguration };
  }

  async encodeDistributeFundsOf(queued = false) {
    const currentConfiguration = queued ? (await this.queuedConfiguration()).configuration : (await this.currentConfiguration()).configuration;
    await this.fetchCurrentTerminal().catch((err) => { console.log(err); });
    const distributionLimit = await this.JBFundAccessConstraintsStore.distributionLimitOf(
      this.projectId,
      currentConfiguration,
      this.JBETHPaymentTerminal.address,
      TOKEN_ETH
    );
    const distributePayoutsOfData: DistributePayoutsOfData = [
      this.projectId,
      distributionLimit[0],
      DISTRIBUTION_CURRENCY_USD,
      TOKEN_ETH,
      0,
      ethers.utils.formatBytes32String(DEFAULT_MEMO)
    ];
    const encodedDistribution = this.JBETHPaymentTerminal.interface.encodeFunctionData(
      'distributePayoutsOf',
      distributePayoutsOfData
    );
    // console.dir(this.JBETHPaymentTerminal.interface.decodeFunctionData(
    //   'distributePayoutsOf',
    //   encodedDistribution
    // ), { depth: null });
    return { address: this.JBETHPaymentTerminal.address, bytes: encodedDistribution };
  }

  async sendDistributeFundsOf(d: DistributePayoutsOfData): Promise<ContractTransaction> {
    await this.fetchCurrentTerminal().catch((err) => { console.log(err); });
    return getJBETHPaymentTerminal(this.wallet, { network: this.network }).distributePayoutsOf(...d);
  }
}
