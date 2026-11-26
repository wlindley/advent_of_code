import { describe, expect, it } from 'vitest';
import { ADD_OPERATOR, MUL_OPERATOR } from '../../shared';
import { CONCAT_OPERATOR, PART2_OPERATORS } from './index';

describe('CONCAT_OPERATOR', () => {
  it('exposes frozen metadata and Part 2 operator ordering', () => {
    expect(CONCAT_OPERATOR.id).toBe('concat');
    expect(CONCAT_OPERATOR.symbol).toBe('||');
    expect(CONCAT_OPERATOR.label).toBe('Concat');
    expect(Object.isFrozen(CONCAT_OPERATOR)).toBe(true);
    expect(Object.isFrozen(PART2_OPERATORS)).toBe(true);
    expect(PART2_OPERATORS).toEqual([MUL_OPERATOR, CONCAT_OPERATOR, ADD_OPERATOR]);
  });

  it('applies and inverts accurately across power-of-10 boundaries', () => {
    const boundaries = [1n, 9n, 10n, 99n, 100n, 999n, 1000n, 10n ** 18n];
    for (const right of boundaries) {
      const joined = CONCAT_OPERATOR.apply(42n, right);
      expect(joined).toBe(BigInt(`42${right}`));
      expect(CONCAT_OPERATOR.tryInvert(joined, right)).toBe(42n);
    }
  });

  it('rejects zero-predecessor traps where remaining <= right or diff < scale', () => {
    expect(CONCAT_OPERATOR.tryInvert(15n, 15n)).toBeNull();
    expect(CONCAT_OPERATOR.tryInvert(10n, 10n)).toBeNull();
    expect(CONCAT_OPERATOR.tryInvert(5n, 15n)).toBeNull();
    expect(CONCAT_OPERATOR.tryInvert(9n, 5n)).toBeNull();
    expect(CONCAT_OPERATOR.tryInvert(19n, 10n)).toBeNull();
  });

  it('handles leading-zero suffix traps correctly', () => {
    expect(CONCAT_OPERATOR.tryInvert(105n, 5n)).toBe(10n);
    expect(CONCAT_OPERATOR.tryInvert(1005n, 5n)).toBe(100n);
    expect(CONCAT_OPERATOR.tryInvert(105n, 15n)).toBeNull();
    expect(CONCAT_OPERATOR.tryInvert(1000n, 10n)).toBeNull();
    expect(CONCAT_OPERATOR.tryInvert(1010n, 10n)).toBe(10n);
    expect(CONCAT_OPERATOR.tryInvert(110n, 10n)).toBe(1n);
  });

  it('explains prune reasons for both <= and suffix-mismatch branches', () => {
    expect(CONCAT_OPERATOR.explainPrune(10n, 10n)).toBe('10 <= 10');
    expect(CONCAT_OPERATOR.explainPrune(4n, 10n)).toBe('4 <= 10');
    expect(CONCAT_OPERATOR.explainPrune(105n, 15n)).toBe('105 !ends 15');
    expect(CONCAT_OPERATOR.explainPrune(1000n, 10n)).toBe('1000 !ends 10');
  });

  it('throws RangeError when apply receives right <= 0n', () => {
    expect(() => CONCAT_OPERATOR.apply(5n, 0n)).toThrow(RangeError);
    expect(() => CONCAT_OPERATOR.apply(5n, -7n)).toThrow(RangeError);
  });

  it('throws RangeError when tryInvert receives right <= 0n', () => {
    expect(() => CONCAT_OPERATOR.tryInvert(105n, 0n)).toThrow(RangeError);
    expect(() => CONCAT_OPERATOR.tryInvert(105n, -7n)).toThrow(RangeError);
  });
});
