import { describe, expect, it } from 'vitest';
import { DivideByThreeRule, PART1_ROUNDS, PART1_RULE, solver } from './index';

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

describe('Day 11 Part 1 DivideByThreeRule', () => {
  it('exposes PART1_ROUNDS = 20, frozen rule instance, and floor(worry / 3) relief', () => {
    expect(PART1_ROUNDS).toBe(20);
    expect(Object.isFrozen(PART1_RULE)).toBe(true);
    expect(PART1_RULE).toBeInstanceOf(DivideByThreeRule);
    expect(PART1_RULE.rounds).toBe(20);
    expect(PART1_RULE.reliefLabel).toBe('floor(worry / 3)');
    expect(PART1_RULE.relieve(1501n)).toBe(500n);
    expect(PART1_RULE.relieve(2n)).toBe(0n);
  });
});

describe('Day 11 Part 1 solver', () => {
  it('is frozen and solves the official example to 10605n', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const setup = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(setup)).toBe(10605n);
  });

  it('produces exact round 1 and round 20 trace snapshots with terminal monkeyBusiness 10605n', () => {
    const setup = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(setup);
    expect(frames).toHaveLength(21);
    expect(frames[1]!.queues).toEqual([
      [20n, 23n, 27n, 26n],
      [2080n, 25n, 167n, 207n, 401n, 1046n],
      [],
      [],
    ]);
    expect(frames[20]!.queues).toEqual([
      [10n, 12n, 14n, 26n, 34n],
      [245n, 93n, 53n, 199n, 115n],
      [],
      [],
    ]);
    expect(frames[20]!.counts).toEqual([101, 95, 7, 105]);
    expect(frames[20]!.monkeyBusiness).toBe(10605n);
  });
});
