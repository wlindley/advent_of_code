import { describe, expect, it } from 'vitest';
import {
  ClosedInterval,
  executeSolver,
  type Clock,
} from '../../../../shared/core';
import { Almanac, RangeMap, RangeRule } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'seeds: 79 14 55 13',
  '',
  'seed-to-soil map:',
  '50 98 2',
  '52 50 48',
  '',
  'soil-to-fertilizer map:',
  '0 15 37',
  '37 52 2',
  '39 0 15',
  '',
  'fertilizer-to-water map:',
  '49 53 8',
  '0 11 42',
  '42 0 7',
  '57 7 4',
  '',
  'water-to-light map:',
  '88 18 7',
  '18 25 70',
  '',
  'light-to-temperature map:',
  '45 77 23',
  '81 45 19',
  '68 64 13',
  '',
  'temperature-to-humidity map:',
  '0 69 1',
  '1 0 69',
  '',
  'humidity-to-location map:',
  '60 56 37',
  '56 93 4',
].join('\n');

describe('2023 Day 05 Part 2 solver', () => {
  it('solves the official example to 46n and coalesces Stage 6 ribbons into [46, 60]', () => {
    const almanac = solver.parse(OFFICIAL_EXAMPLE);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.solve(almanac)).toBe(46n);

    const frames = solver.trace!(almanac);
    expect(frames.length).toBe(7);
    const stage6 = frames[6]!;
    expect(stage6.sourceCategory).toBe('humidity');
    expect(stage6.destCategory).toBe('location');
    expect(stage6.output.intervals[0]).toEqual(new ClosedInterval(46n, 60n));
    expect(stage6.minOutput).toBe(46n);
  });

  it('runs via executeSolver using a deterministic fake Clock', () => {
    const times = [100, 114.5];
    let idx = 0;
    const fakeClock: Clock = {
      nowMs: () => times[idx++] ?? 114.5,
    };
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result).toEqual({ answer: 46n, elapsedMs: 14.5, runtime: 'main-thread' });
  });

  it('preserves full BigInt precision well above Number.MAX_SAFE_INTEGER', () => {
    const base = 9_007_199_254_740_993n; // 2^53 + 1
    const almanac = new Almanac(
      [base, 10n],
      [
        new RangeMap('seed', 'soil', [RangeRule.fromTriple(base + 50n, base + 2n, 5n)]),
        new RangeMap('soil', 'location', [RangeRule.fromTriple(base - 10n, base + 51n, 3n)]),
      ],
    );
    expect(solver.solve(almanac)).toBe(base - 10n);
  });
});
