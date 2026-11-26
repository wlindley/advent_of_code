import { describe, expect, it } from 'vitest';
import { LEAST_COMMON_CRITERION, MOST_COMMON_CRITERION } from './criteria';
import { BitTally } from './report';

describe('BitCriterion strategies', () => {
  it('MOST_COMMON_CRITERION selects 1 when ones > zeros or tied, and 0 when ones < zeros', () => {
    expect(Object.isFrozen(MOST_COMMON_CRITERION)).toBe(true);
    expect(MOST_COMMON_CRITERION.name).toBe('most-common');
    expect(MOST_COMMON_CRITERION.selectBit(new BitTally(7, 5))).toBe('1');
    expect(MOST_COMMON_CRITERION.selectBit(new BitTally(4, 4))).toBe('1');
    expect(MOST_COMMON_CRITERION.selectBit(new BitTally(3, 5))).toBe('0');
  });

  it('LEAST_COMMON_CRITERION selects 1 only when ones < zeros, and 0 when ones >= zeros', () => {
    expect(Object.isFrozen(LEAST_COMMON_CRITERION)).toBe(true);
    expect(LEAST_COMMON_CRITERION.name).toBe('least-common');
    expect(LEAST_COMMON_CRITERION.selectBit(new BitTally(3, 5))).toBe('1');
    expect(LEAST_COMMON_CRITERION.selectBit(new BitTally(4, 4))).toBe('0');
    expect(LEAST_COMMON_CRITERION.selectBit(new BitTally(7, 5))).toBe('0');
  });
});
