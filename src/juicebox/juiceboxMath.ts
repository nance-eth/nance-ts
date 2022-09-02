/* eslint-disable import/no-extraneous-dependencies */
import * as constants from '@ethersproject/constants';
import { BigNumber } from '@ethersproject/bignumber';

export const WAD_DECIMALS = 18;

export const SECONDS_IN_DAY = 24 * 60 * 60;
export const SECONDS_IN_HOUR = 60 * 60;

export const PROJECT_PAY_CHARACTER_LIMIT = 16;

export const TEN_THOUSAND = 10000;
export const ONE_MILLION = 1000000;
export const ONE_BILLION = 1000000000;

export const MaxUint232 = constants.MaxUint256.add(1)
  .div(2 ** 24)
  .sub(1);
export const MaxUint88 = 2 ** 88 - 1;
export const MaxUint54 = BigNumber.from(2).pow(54).sub(1);
export const MaxUint48 = 2 ** 48 - 1;

export const MAX_RESERVED_RATE = TEN_THOUSAND;
export const MAX_REDEMPTION_RATE = TEN_THOUSAND;
export const MAX_DISCOUNT_RATE = ONE_BILLION;
export const SPLITS_TOTAL_PERCENT = ONE_BILLION;
export const MAX_DISTRIBUTION_LIMIT = MaxUint232;

export const DEFAULT_MINT_RATE = ONE_MILLION;
export const MAX_MINT_RATE = Math.floor(MaxUint88 / 10 ** 18);

const MAX_FEE = ONE_BILLION;
