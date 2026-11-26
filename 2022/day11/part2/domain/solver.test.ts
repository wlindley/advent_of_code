import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { type KeepAwayRule, KeepAwaySetup, simulateKeepAway } from '../../shared';
import { ModularReliefRule, PART2_ROUNDS, PART2_RULE, solver } from './index';

const EXAMPLE_INPUT = [
  'Monkey 0:',
  '  Starting items: 79, 98',
  '  Operation: new = old * 19',
  '  Test: divisible by 23',
  '    If true: throw to monkey 2',
  '    If false: throw to monkey 3',
  '',
  'Monkey 1:',
  '  Starting items: 54, 65, 75, 74',
  '  Operation: new = old + 6',
  '  Test: divisible by 19',
  '    If true: throw to monkey 2',
  '    If false: throw to monkey 0',
  '',
  'Monkey 2:',
  '  Starting items: 79, 60, 97',
  '  Operation: new = old * old',
  '  Test: divisible by 13',
  '    If true: throw to monkey 1',
  '    If false: throw to monkey 3',
  '',
  'Monkey 3:',
  '  Starting items: 74',
  '  Operation: new = old + 3',
  '  Test: divisible by 17',
  '    If true: throw to monkey 0',
  '    If false: throw to monkey 1',
].join('\n');

class RoundLimitedRule implements KeepAwayRule {
  readonly rounds: number;
  readonly reliefLabel = PART2_RULE.reliefLabel;

  constructor(rounds: number) {
    this.rounds = rounds;
  }

  relieve(worry: bigint, commonModulus: bigint): bigint {
    return PART2_RULE.relieve(worry, commonModulus);
  }
}

describe('ModularReliefRule', () => {
  it('exposes frozen rule metadata for 10,000 rounds', () => {
    const rule = new ModularReliefRule();
    expect(PART2_ROUNDS).toBe(10_000);
    expect(Object.isFrozen(rule)).toBe(true);
    expect(Object.isFrozen(PART2_RULE)).toBe(true);
    expect(rule.rounds).toBe(10_000);
    expect(PART2_RULE.rounds).toBe(10_000);
    expect(rule.reliefLabel).toBe('worry mod LCM');
  });

  it('reduces non-negative worry modulo positive commonModulus', () => {
    const rule = new ModularReliefRule();
    expect(rule.relieve(0n, 97n)).toBe(0n);
    expect(rule.relieve(42n, 97n)).toBe(42n);
    expect(rule.relieve(97n, 97n)).toBe(0n);
    expect(rule.relieve(200n, 97n)).toBe(6n);
    expect(rule.relieve(12345n, 1n)).toBe(0n);
    expect(rule.relieve((1n << 128n) + 5n, 1n << 128n)).toBe(5n);
  });

  it('rejects negative worry', () => {
    const rule = new ModularReliefRule();
    expect(() => rule.relieve(-1n, 10n)).toThrow(RangeError);
  });

  it('rejects zero commonModulus', () => {
    const rule = new ModularReliefRule();
    expect(() => rule.relieve(10n, 0n)).toThrow(RangeError);
  });

  it('rejects negative commonModulus', () => {
    const rule = new ModularReliefRule();
    expect(() => rule.relieve(10n, -5n)).toThrow(RangeError);
  });
});

describe('Part 2 solver', () => {
  it('matches official example checkpoints at rounds 1, 20, 1000, and 10000', () => {
    const setup = solver.parse(EXAMPLE_INPUT);
    expect(simulateKeepAway(setup, new RoundLimitedRule(1))).toEqual([2, 4, 3, 6]);
    expect(simulateKeepAway(setup, new RoundLimitedRule(20))).toEqual([99, 97, 8, 103]);
    expect(simulateKeepAway(setup, new RoundLimitedRule(1000))).toEqual([5204, 4792, 199, 5192]);
    expect(simulateKeepAway(setup, new RoundLimitedRule(10_000))).toEqual([
      52166, 47830, 1938, 52013,
    ]);
  });

  it('solves official example and integrates with executeSolver as frozen solver', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const setup = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(setup)).toBe(2713310158n);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(2713310158n);
  });

  it('handles composite shared-factor divisors', () => {
    const raw = [
      'Monkey 0:\n  Starting items: 5, 12\n  Operation: new = old + 1\n  Test: divisible by 4\n    If true: throw to monkey 1\n    If false: throw to monkey 2',
      'Monkey 1:\n  Starting items: 6\n  Operation: new = old * 2\n  Test: divisible by 6\n    If true: throw to monkey 2\n    If false: throw to monkey 0',
      'Monkey 2:\n  Starting items: 11\n  Operation: new = old * old\n  Test: divisible by 12\n    If true: throw to monkey 0\n    If false: throw to monkey 1',
    ].join('\n\n');
    const setup = KeepAwaySetup.parse(raw);
    expect(setup.commonModulus).toBe(12n);
    expect(solver.solve(setup)).toBeGreaterThan(0n);
  });

  it('handles trivial divisor 1 and all-empty queues', () => {
    const trivialRaw = [
      'Monkey 0:\n  Starting items: 3\n  Operation: new = old + 5\n  Test: divisible by 1\n    If true: throw to monkey 1\n    If false: throw to monkey 1',
      'Monkey 1:\n  Starting items:\n  Operation: new = old * 2\n  Test: divisible by 1\n    If true: throw to monkey 0\n    If false: throw to monkey 0',
    ].join('\n\n');
    expect(solver.solve(solver.parse(trivialRaw))).toBe(100_000_000n);

    const emptyRaw = [
      'Monkey 0:\n  Starting items:\n  Operation: new = old + 1\n  Test: divisible by 2\n    If true: throw to monkey 1\n    If false: throw to monkey 1',
      'Monkey 1:\n  Starting items:\n  Operation: new = old + 2\n  Test: divisible by 3\n    If true: throw to monkey 0\n    If false: throw to monkey 0',
    ].join('\n\n');
    expect(solver.solve(solver.parse(emptyRaw))).toBe(0n);
  });

  it('produces sampled trace frames ending with complete 10,000-round state', () => {
    const setup = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(setup);
    expect(frames.length).toBe(200);
    expect(frames[0]!.round).toBe(0);
    const last = frames[frames.length - 1]!;
    expect(last.round).toBe(10_000);
    expect(last.isComplete).toBe(true);
    expect(last.counts).toEqual([52166, 47830, 1938, 52013]);
    expect(last.monkeyBusiness).toBe(2713310158n);

    const compact = solver.trace!(setup, { maxSteps: 10 });
    expect(compact.length).toBe(10);
    expect(compact[0]!.round).toBe(0);
    expect(compact[compact.length - 1]!.round).toBe(10_000);
    expect(compact[compact.length - 1]!.isComplete).toBe(true);
  });
});
