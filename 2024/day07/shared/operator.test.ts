import { describe, expect, it } from 'vitest';
import { ADD_OPERATOR, MUL_OPERATOR, PART1_OPERATORS } from './operator';

describe('CalibrationOperator', () => {
  it('applies addition and multiplication on bigints', () => {
    expect(ADD_OPERATOR.id).toBe('add');
    expect(ADD_OPERATOR.symbol).toBe('+');
    expect(ADD_OPERATOR.label).toBe('Add');
    expect(ADD_OPERATOR.apply(81n, 40n)).toBe(121n);

    expect(MUL_OPERATOR.id).toBe('mul');
    expect(MUL_OPERATOR.symbol).toBe('*');
    expect(MUL_OPERATOR.label).toBe('Multiply');
    expect(MUL_OPERATOR.apply(10n, 19n)).toBe(190n);
  });

  it('inverts addition only when remaining - right >= 1', () => {
    expect(ADD_OPERATOR.tryInvert(19n, 10n)).toBe(9n);
    expect(ADD_OPERATOR.tryInvert(11n, 10n)).toBe(1n);
    expect(ADD_OPERATOR.tryInvert(10n, 10n)).toBeNull();
    expect(ADD_OPERATOR.tryInvert(5n, 10n)).toBeNull();
  });

  it('inverts multiplication only when remaining is divisible by right', () => {
    expect(MUL_OPERATOR.tryInvert(190n, 19n)).toBe(10n);
    expect(MUL_OPERATOR.tryInvert(10n, 1n)).toBe(10n);
    expect(MUL_OPERATOR.tryInvert(190n, 7n)).toBeNull();
  });

  it('explains pruned branches for both operators', () => {
    expect(ADD_OPERATOR.explainPrune(5n, 10n)).toBe('5 - 10 = -5 < 1');
    expect(ADD_OPERATOR.explainPrune(10n, 10n)).toBe('10 - 10 = 0 < 1');
    expect(MUL_OPERATOR.explainPrune(190n, 7n)).toBe('190 mod 7 = 1');
  });

  it('exposes frozen operator objects and PART1_OPERATORS', () => {
    expect(Object.isFrozen(ADD_OPERATOR)).toBe(true);
    expect(Object.isFrozen(MUL_OPERATOR)).toBe(true);
    expect(Object.isFrozen(PART1_OPERATORS)).toBe(true);
    expect(PART1_OPERATORS).toEqual([MUL_OPERATOR, ADD_OPERATOR]);
  });
});
