import { describe, expect, it } from 'vitest';
import {
  type KeepAwayRule,
  KeepAwaySetup,
  computeMonkeyBusiness,
  simulateKeepAway,
} from '../../shared';
import { PART1_RULE, solver } from './index';

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

class ModularReliefRule implements KeepAwayRule {
  readonly rounds: number;
  readonly reliefLabel = 'worry % commonModulus';

  constructor(rounds: number) {
    this.rounds = rounds;
    Object.freeze(this);
  }

  relieve(worry: bigint, commonModulus: bigint): bigint {
    return worry % commonModulus;
  }
}

function oracleSimulate(
  setup: KeepAwaySetup,
  rule: KeepAwayRule,
  checkpoints: readonly number[] = [],
): { counts: number[]; queues: bigint[][]; snapshots: Map<number, { counts: number[]; queues: bigint[][] }> } {
  const queues = setup.monkeys.map((m) => [...m.startingItems]);
  const counts = new Array<number>(setup.monkeyCount).fill(0);
  const mod = setup.commonModulus;
  const watch = new Set(checkpoints);
  const snapshots = new Map<number, { counts: number[]; queues: bigint[][] }>();

  for (let round = 1; round <= rule.rounds; round += 1) {
    for (let m = 0; m < setup.monkeyCount; m += 1) {
      const spec = setup.monkeys[m]!;
      while (queues[m]!.length > 0) {
        const worry = rule.relieve(spec.operation.apply(queues[m]!.shift()!), mod);
        counts[m]! += 1;
        const target = worry % spec.divisor === 0n ? spec.trueTarget : spec.falseTarget;
        queues[target]!.push(worry);
      }
    }
    if (watch.has(round)) {
      snapshots.set(round, { counts: [...counts], queues: queues.map((q) => [...q]) });
    }
  }
  return { counts, queues, snapshots };
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateRandomSetup(rng: () => number, allowSquare: boolean): string {
  const count = 2 + Math.floor(rng() * 7);
  const ops = allowSquare
    ? ['old + 1', 'old + 7', 'old * 3', 'old * 11', 'old * old', 'old + old']
    : ['old + 1', 'old + 7', 'old * 2', 'old * 3', 'old + old'];
  const divisors = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  const blocks: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const itemCount = rng() < 0.2 ? 0 : 1 + Math.floor(rng() * 5);
    const items = Array.from({ length: itemCount }, () => String(1 + Math.floor(rng() * 90)));
    const op = ops[Math.floor(rng() * ops.length)]!;
    const div = divisors[Math.floor(rng() * divisors.length)]!;
    let t1 = Math.floor(rng() * (count - 1));
    if (t1 >= i) t1 += 1;
    let t2 = rng() < 0.25 ? t1 : Math.floor(rng() * (count - 1));
    if (t2 !== t1 && t2 >= i) t2 += 1;
    blocks.push(
      `Monkey ${i}:\n  Starting items: ${items.join(', ')}\n  Operation: new = ${op}\n` +
        `  Test: divisible by ${div}\n    If true: throw to monkey ${t1}\n    If false: throw to monkey ${t2}`,
    );
  }
  return blocks.join('\n\n');
}

describe('Day 11 Part 1 oracle verification', () => {
  it('matches official example round 1, 2, 10, 15, and 20 snapshots and final answer', () => {
    const setup = solver.parse(EXAMPLE_INPUT);
    const trace = solver.trace!(setup);
    const oracle = oracleSimulate(setup, PART1_RULE, [1, 2, 10, 15, 20]);

    for (const r of [1, 2, 10, 15, 20]) {
      const snap = oracle.snapshots.get(r)!;
      expect(trace[r]!.queues).toEqual(snap.queues);
      expect(trace[r]!.counts).toEqual(snap.counts);
    }
    expect(oracle.counts).toEqual([101, 95, 7, 105]);
    expect(solver.solve(setup)).toBe(10605n);
  });

  it('verifies Part 2 readiness with ModularReliefRule(10000) on official example', () => {
    const setup = KeepAwaySetup.parse(EXAMPLE_INPUT);
    const rule = new ModularReliefRule(10_000);
    const oracle = oracleSimulate(setup, rule, [1, 20, 1000, 10_000]);

    expect(oracle.snapshots.get(1)!.counts).toEqual([2, 4, 3, 6]);
    expect(oracle.snapshots.get(20)!.counts).toEqual([99, 97, 8, 103]);
    expect(oracle.snapshots.get(1000)!.counts).toEqual([5204, 4792, 199, 5192]);
    expect(oracle.counts).toEqual([52166, 47830, 1938, 52013]);
    expect(simulateKeepAway(setup, rule)).toEqual(oracle.counts);
    expect(computeMonkeyBusiness(simulateKeepAway(setup, rule))).toBe(2713310158n);
  });

  it('matches independent FIFO oracle across 80 seeded random setups under both rules', () => {
    const rng = createRng(202211);
    const modRule = new ModularReliefRule(30);
    const shortFloorRule: KeepAwayRule = {
      rounds: 5,
      reliefLabel: 'floor(worry / 3)',
      relieve: (worry) => PART1_RULE.relieve(worry),
    };
    for (let i = 0; i < 80; i += 1) {
      const p1Setup = KeepAwaySetup.parse(generateRandomSetup(rng, false));
      const p1Oracle = oracleSimulate(p1Setup, PART1_RULE);
      expect(simulateKeepAway(p1Setup, PART1_RULE)).toEqual(p1Oracle.counts);
      expect(solver.solve(p1Setup)).toBe(computeMonkeyBusiness(p1Oracle.counts));

      const modSetup = KeepAwaySetup.parse(generateRandomSetup(rng, true));
      const modOracle = oracleSimulate(modSetup, modRule);
      expect(simulateKeepAway(modSetup, modRule)).toEqual(modOracle.counts);
      expect(simulateKeepAway(modSetup, shortFloorRule)).toEqual(
        oracleSimulate(modSetup, shortFloorRule).counts,
      );
    }
  });
});
