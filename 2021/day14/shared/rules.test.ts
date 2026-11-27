import { describe, expect, it } from 'vitest';
import { addPairCount, InsertionRule, validateStepCount } from './rules';

describe('validateStepCount', () => {
  it('accepts zero and positive safe integers', () => {
    expect(validateStepCount(0)).toBe(0);
    expect(validateStepCount(10)).toBe(10);
    expect(validateStepCount(40)).toBe(40);
  });

  it('rejects negative, fractional, non-finite, and unsafe numbers', () => {
    expect(() => validateStepCount(-1)).toThrow(RangeError);
    expect(() => validateStepCount(1.5)).toThrow(RangeError);
    expect(() => validateStepCount(Number.NaN)).toThrow(RangeError);
    expect(() => validateStepCount(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => validateStepCount(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('addPairCount', () => {
  it('initializes absent keys and accumulates repeated keys', () => {
    const counts = new Map<string, bigint>();
    addPairCount(counts, 'NN', 2n);
    addPairCount(counts, 'NN', 3n);
    expect(counts.get('NN')).toBe(5n);
  });
});

describe('InsertionRule', () => {
  it('computes left and right product pairs and freezes the instance', () => {
    const rule = new InsertionRule('CH', 'B');
    expect(Object.isFrozen(rule)).toBe(true);
    expect(rule.pair).toBe('CH');
    expect(rule.insert).toBe('B');
    expect(rule.leftProduct).toBe('CB');
    expect(rule.rightProduct).toBe('BH');
  });

  it('rejects invalid pair or insert element symbols', () => {
    expect(() => new InsertionRule('C', 'B')).toThrow(RangeError);
    expect(() => new InsertionRule('CHB', 'B')).toThrow(RangeError);
    expect(() => new InsertionRule('ch', 'B')).toThrow(RangeError);
    expect(() => new InsertionRule('CH', '')).toThrow(RangeError);
    expect(() => new InsertionRule('CH', 'BB')).toThrow(RangeError);
    expect(() => new InsertionRule('CH', 'b')).toThrow(RangeError);
  });
});
