import { describe, expect, it } from 'vitest';
import { KeepAwaySetup } from './setup';
import {
  type KeepAwayRule,
  computeMonkeyBusiness,
  findTopTwoIndices,
  simulateKeepAway,
  validateRuleRounds,
} from './simulation';

const TWO_MONKEY_RAW = [
  'Monkey 0:',
  '  Starting items: 10, 15',
  '  Operation: new = old + 1',
  '  Test: divisible by 2',
  '    If true: throw to monkey 1',
  '    If false: throw to monkey 1',
  '',
  'Monkey 1:',
  '  Starting items: 20',
  '  Operation: new = old * 3',
  '  Test: divisible by 5',
  '    If true: throw to monkey 0',
  '    If false: throw to monkey 0',
].join('\n');

const identityRule = (rounds: number): KeepAwayRule => ({
  rounds,
  reliefLabel: 'none',
  relieve: (worry) => worry,
});

describe('validateRuleRounds', () => {
  it('accepts zero and positive safe integers', () => {
    expect(validateRuleRounds(0)).toBe(0);
    expect(validateRuleRounds(20)).toBe(20);
  });

  it('rejects negative or non-integer rounds', () => {
    expect(() => validateRuleRounds(-1)).toThrow(RangeError);
    expect(() => validateRuleRounds(2.5)).toThrow(RangeError);
    expect(() => validateRuleRounds(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('findTopTwoIndices and computeMonkeyBusiness', () => {
  it('finds top two indices favoring lower index on ties', () => {
    const tieAll = findTopTwoIndices([5, 5, 5]);
    expect(Object.isFrozen(tieAll)).toBe(true);
    expect(tieAll).toEqual([0, 1]);
    expect(findTopTwoIndices([5, 10, 10])).toEqual([1, 2]);
    expect(findTopTwoIndices([5, 10, 15])).toEqual([2, 1]);
    expect(findTopTwoIndices([0, 0])).toEqual([0, 1]);
  });

  it('computes BigInt monkey business without 53-bit overflow', () => {
    expect(computeMonkeyBusiness([0, 0, 0])).toBe(0n);
    expect(computeMonkeyBusiness([100_000_000, 100_000_000, 1])).toBe(10_000_000_000_000_000n);
  });

  it('rejects fewer than 2 counts or invalid entries', () => {
    expect(() => findTopTwoIndices([1])).toThrow(RangeError);
    expect(() => findTopTwoIndices([1, -1])).toThrow(RangeError);
    expect(() => findTopTwoIndices([1.5, 2])).toThrow(RangeError);
  });
});

describe('simulateKeepAway', () => {
  it('returns frozen zeros when rounds is 0', () => {
    const setup = KeepAwaySetup.parse(TWO_MONKEY_RAW);
    const counts = simulateKeepAway(setup, identityRule(0));
    expect(Object.isFrozen(counts)).toBe(true);
    expect(counts).toEqual([0, 0]);
  });

  it('distinguishes same-round forward throws from wrap-around throws', () => {
    const setup = KeepAwaySetup.parse(TWO_MONKEY_RAW);
    // Round 1: Monkey 0 inspects 2 items -> throws both to Monkey 1 (same round).
    // Monkey 1 inspects its 1 initial + 2 received = 3 items -> throws all to Monkey 0 (wrap).
    expect(simulateKeepAway(setup, identityRule(1))).toEqual([2, 3]);
    // Round 2: Monkey 0 inspects 3 items -> Monkey 1 inspects 3 items. Total: [5, 6].
    expect(simulateKeepAway(setup, identityRule(2))).toEqual([5, 6]);
  });

  it('validates rule.rounds before simulating', () => {
    const setup = KeepAwaySetup.parse(TWO_MONKEY_RAW);
    expect(() => simulateKeepAway(setup, identityRule(-2))).toThrow(RangeError);
  });
});
