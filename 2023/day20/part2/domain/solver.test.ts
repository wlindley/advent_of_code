import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { CircuitSimulator, parseCircuitBlueprint } from '../../shared';
import {
  findMinPressesForRx,
  MAX_CYCLE_SEARCH_PRESSES,
  solver,
  TARGET_MODULE,
} from './index';

const PREFIXES = ['a', 'b', 'c'] as const;
const BITS = ['a', 'b', 'c', 'd'] as const;

function buildCounterCircuit(periods: readonly number[]): string {
  const lines: string[] = [];
  const starts: string[] = [];
  for (let idx = 0; idx < periods.length; idx += 1) {
    const p = PREFIXES[idx]!;
    const period = periods[idx]!;
    const width = Math.ceil(Math.log2(period + 1));
    starts.push(`${p}a`);
    for (let k = 0; k < width; k += 1) {
      const dests: string[] = [];
      if (k + 1 < width) dests.push(`${p}${BITS[k + 1]}`);
      if ((period >> k) & 1) dests.push(`conj${p}`);
      lines.push(`%${p}${BITS[k]} -> ${dests.join(', ')}`);
    }
    const reset = (1 << width) - period;
    const conjDests: string[] = [];
    for (let k = 0; k < width; k += 1) {
      if ((reset >> k) & 1) conjDests.push(`${p}${BITS[k]}`);
    }
    conjDests.push(`inv${p}`);
    lines.push(`&conj${p} -> ${conjDests.join(', ')}`);
    lines.push(`&inv${p} -> agg`);
  }
  return [`broadcaster -> ${starts.join(', ')}`, ...lines, '&agg -> rx'].join('\n');
}

function bruteForceRxLowPress(raw: string): bigint {
  const sim = new CircuitSimulator(parseCircuitBlueprint(raw));
  for (let press = 1; press <= 500; press += 1) {
    let hit = false;
    sim.pressButton((event) => {
      if (event.to === 'rx' && event.pulse === 'low') hit = true;
    });
    if (hit) return BigInt(press);
  }
  throw new Error('Oracle exceeded press bound');
}

describe('Day 20 Part 2 solver', () => {
  it('matches brute-force CircuitSimulator oracle across multi-counter LCM cases', () => {
    const cases: readonly [readonly number[], bigint][] = [
      [[3, 5], 15n],
      [[5, 7], 35n],
      [[9, 15], 45n],
      [[6, 10], 30n],
      [[3, 9], 9n],
      [[5, 7, 9], 315n],
    ];
    for (const [periods, expected] of cases) {
      const raw = buildCounterCircuit(periods);
      expect(bruteForceRxLowPress(raw)).toBe(expected);
      expect(solver.solve(solver.parse(raw))).toBe(expected);
    }
  });

  it('solves direct, inverter, direct-aggregator, double-low, and duplicate-high topologies', () => {
    expect(solver.solve(solver.parse('broadcaster -> rx'))).toBe(1n);
    expect(solver.solve(solver.parse('broadcaster -> a\n%a -> inv\n&inv -> rx'))).toBe(1n);
    expect(solver.solve(solver.parse('broadcaster -> a, b\n%a -> agg\n%b -> agg\n&agg -> rx'))).toBe(1n);

    const doubleLowRaw = 'broadcaster -> a, b\n%a -> inva\n&inva -> rx\n%b -> invb\n&invb -> rx';
    const doubleLowBp = solver.parse(doubleLowRaw);
    expect(solver.solve(doubleLowBp)).toBe(1n);
    const doubleLowTrace = solver.trace!(doubleLowBp);
    expect(doubleLowTrace).toHaveLength(2);
    expect(doubleLowTrace[1]!.activePulse).toEqual({ press: 1, from: 'inva', to: 'rx', pulse: 'low' });

    const dupHighRaw = [
      'broadcaster -> a, b, yc',
      '%a -> x',
      '%b -> x',
      '%d -> x',
      '&x -> agg',
      '%yc -> inv',
      '&inv -> agg',
      '&agg -> rx',
    ].join('\n');
    expect(solver.solve(solver.parse(dupHighRaw))).toBe(2n);
  });

  it('executes via executeSolver with fake Clock and builds bounded traces', () => {
    const example = buildCounterCircuit([5, 7]);
    let now = 10;
    const fakeClock: Clock = { nowMs: () => (now += 4) };
    const result = executeSolver(solver, example, fakeClock);
    expect(result).toEqual({ answer: 35n, elapsedMs: 4, runtime: 'main-thread' });
    expect(TARGET_MODULE).toBe('rx');
    expect(MAX_CYCLE_SEARCH_PRESSES).toBe(100_000);

    const bp = solver.parse(example);
    const fullTrace = solver.trace!(bp);
    expect(fullTrace).toHaveLength(6);
    expect(fullTrace[0]!.stepIndex).toBe(0);
    expect(fullTrace[5]!.caption).toContain('35');

    const capped = solver.trace!(bp, { maxSteps: 2 });
    expect(capped.map((f) => f.stepIndex)).toEqual([0, 5]);
    expect(() => solver.trace!(bp, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects malformed input, invalid maxPresses, missing rx, unreachable rx, and non-zero phase', () => {
    expect(() => solver.parse('not valid')).toThrow();
    const bp = solver.parse('broadcaster -> rx');
    expect(() => findMinPressesForRx(bp, 0)).toThrow(RangeError);

    const missingRx = solver.parse('broadcaster -> a\n%a -> out');
    expect(() => solver.solve(missingRx)).toThrow(/rx/);

    const unreachableDirect = solver.parse('broadcaster -> a\n%b -> rx');
    expect(() => findMinPressesForRx(unreachableDirect, 5)).toThrow(/within 5 presses/);

    const unreachableAgg = solver.parse('broadcaster -> a\n%a -> agg\n%b -> agg\n&agg -> rx');
    expect(() => findMinPressesForRx(unreachableAgg, 10)).toThrow(/phase/i);
    expect(() => findMinPressesForRx(unreachableAgg, 2)).toThrow(/within 2 presses.*agg/);
  });
});
