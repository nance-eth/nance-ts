import { JsonRpcProvider } from '@ethersproject/providers';
import {
  getJBFundingCycleStore,
  getJBController,
  getJBSplitsStore,
  getJBDirectory,
  getJBProjects
} from 'juice-sdk';
import { BigNumber } from '@ethersproject/bignumber';
import { JBSplitStruct, JBGroupedSplitsStruct, JBFundAccessConstraintsStruct } from 'juice-sdk/dist/cjs/types/contracts/JBController';
import { ONE_BILLION } from './juiceboxMath';
import { getJBFundingCycleDataStruct, getJBFundingCycleMetadataStruct } from './typesV2';
import { Payout, Reserved } from '../types';
import { keys } from '../keys';

const JB_FEE = 0.025;
const TOKEN_ETH = '0x000000000000000000000000000000000000EEEe';
const DEFAULT_MUST_START_AT_OR_AFTER = '1';
const DEFAULT_WEIGHT = 0;
const DISTRIBUTION_CURRENCY_USD = 2;
const DISTRIBUTION_CURRENCY_ETH = 1;
const GROUP_ETH_PAYOUT = 1;
const GROUP_RESERVED_TOKENS = 2;

const CSV_HEADING = 'beneficiary,percent,preferClaimed,lockedUntil,projectId,allocator';

export class JuiceboxHandlerV2 {
  provider;
  splitsInterface;
  controllerInterface;
  DEFAULT_PAYMENT_TERMINAL;

  constructor(
    protected projectId: string,
    protected network = 'mainnet' as 'mainnet' | 'rinkeby'
  ) {
    const RPC_HOST = (network === 'mainnet')
      ? `https://mainnet.infura.io/v3/${keys.INFURA_KEY}`
      : `https://rinkeby.infura.io/v3/${keys.INFURA_KEY}`;
    this.provider = new JsonRpcProvider(RPC_HOST);
    this.splitsInterface = getJBSplitsStore(this.provider, { network: this.network }).interface;
    this.controllerInterface = getJBController(this.provider, { network: this.network }).interface;
    this.DEFAULT_PAYMENT_TERMINAL = (network === 'mainnet')
      ? '0x7Ae63FBa045Fec7CaE1a75cF7Aa14183483b8397'
      : '0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8';
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
    const terminal = await getJBDirectory(this.provider, { network: this.network }).terminalsOf(this.projectId);
    const distributionLimit = await getJBController(this.provider, { network: this.network }).distributionLimitOf(
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
    const configuration = (domain === 0) ? await this.queuedConfiguration() : domain;
    console.log(configuration);
    return this.splitsInterface.encodeFunctionData(
      'set',
      [
        BigNumber.from(projectId),
        BigNumber.from(configuration),
        params
      ]
    );
  }

  // buildJBGroupedSplitsStruct(
  //   distributionLimit: number,
  //   distrubutionPayouts: Payout[],
  //   distributionReserved: Reserved[]
  // ): JBGroupedSplitsStruct {
  //   const targetFundingTotal = distrubutionPayouts.reduce((total, payout) => {
  //     // dont include fee if payout is to a V2 project
  //     return (payout.address.includes('V2'))
  //       ? total + payout.amountUSD
  //       : total + (payout.amountUSD * (1 + JB_FEE));
  //   }, 0);
  //   return {}
  // }

  async getReconfigureFundingCyclesOfHex() {
    const { fundingCycle, metadata } = await getJBController(this.provider).queuedFundingCycleOf(this.projectId);
    const reconfigFundingCycleData = getJBFundingCycleDataStruct(fundingCycle, BigNumber.from(DEFAULT_WEIGHT));
    const reconfigFundingCycleMetaData = getJBFundingCycleMetadataStruct(metadata);
    const mustStartAtOrAfter = DEFAULT_MUST_START_AT_OR_AFTER;
  }
}
