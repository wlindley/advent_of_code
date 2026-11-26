import type { Bit, BitTally } from './report';

/** Strategy selecting a single bit from a column's 1/0 tally. */
export interface BitCriterion {
  readonly name: string;
  selectBit(tally: BitTally): Bit;
}

/** Selects '1' when ones >= zeros (ties favor '1'), otherwise '0'. */
export const MOST_COMMON_CRITERION: BitCriterion = Object.freeze({
  name: 'most-common',
  selectBit(tally: BitTally): Bit {
    return tally.ones >= tally.zeros ? '1' : '0';
  },
});

/** Selects '1' when ones < zeros (ties favor '0'), otherwise '0'. */
export const LEAST_COMMON_CRITERION: BitCriterion = Object.freeze({
  name: 'least-common',
  selectBit(tally: BitTally): Bit {
    return tally.ones < tally.zeros ? '1' : '0';
  },
});
