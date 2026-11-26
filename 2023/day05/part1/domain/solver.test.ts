import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
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

interface Triple {
  readonly dest: bigint;
  readonly src: bigint;
  readonly len: bigint;
}

function linearScanOracle(seeds: readonly bigint[], stages: readonly (readonly Triple[])[]): bigint {
  let lowest: bigint | undefined;
  for (const seed of seeds) {
    let val = seed;
    for (const triples of stages) {
      for (const { dest, src, len } of triples) {
        if (val >= src && val < src + len) {
          val = dest + (val - src);
          break;
        }
      }
    }
    if (lowest === undefined || val < lowest) lowest = val;
  }
  return lowest!;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1_664_525 * state + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('day05 part1 solver', () => {
  it('solves and traces all 4 journeys of the official example', () => {
    const almanac = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(almanac)).toBe(35n);

    const frames = solver.trace!(almanac);
    expect(frames).toHaveLength(4);
    expect(frames[0]!.stageValues).toEqual([79n, 81n, 81n, 81n, 74n, 78n, 78n, 82n]);
    expect(frames[1]!.stageValues).toEqual([14n, 14n, 53n, 49n, 42n, 42n, 43n, 43n]);
    expect(frames[2]!.stageValues).toEqual([55n, 57n, 57n, 53n, 46n, 82n, 82n, 86n]);
    expect(frames[3]!.stageValues).toEqual([13n, 13n, 52n, 41n, 34n, 34n, 35n, 35n]);
    expect(frames[3]!.bestLocation).toBe(35n);
    expect(frames[3]!.bestSeed).toBe(13n);
  });

  it('executes via executeSolver with a hand-written Clock fake', () => {
    const times = [10, 27.5];
    let idx = 0;
    const fakeClock: Clock = { nowMs: () => times[idx++]! };
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result.answer).toBe(35n);
    expect(result.elapsedMs).toBe(17.5);
    expect(result.runtime).toBe('main-thread');
  });

  it('preserves exact bigint precision above Number.MAX_SAFE_INTEGER', () => {
    const base = 9_007_199_254_740_993n; // 2^53 + 1
    const raw = [
      `seeds: ${base} ${base + 10n}`,
      '',
      'seed-to-soil map:',
      `${base + 100n} ${base} 3`,
      '',
      'soil-to-location map:',
      `${base - 5n} ${base + 100n} 2`,
    ].join('\n');

    const parsed = solver.parse(raw);
    expect(solver.solve(parsed)).toBe(base - 5n);
  });

  it('matches an independent linear-scan oracle across 25 deterministic random almanacs', () => {
    const next = makeRng(20230501);
    for (let trial = 0; trial < 25; trial += 1) {
      const seedCount = 1 + Math.floor(next() * 12);
      const seeds: bigint[] = [];
      for (let s = 0; s < seedCount; s += 1) {
        seeds.push(BigInt(Math.floor(next() * 500)));
      }
      const stageCount = 1 + Math.floor(next() * 5);
      const stages: Triple[][] = [];
      const lines: string[] = [`seeds: ${seeds.join(' ')}`];

      for (let st = 0; st < stageCount; st += 1) {
        const triples: Triple[] = [];
        let cursor = BigInt(Math.floor(next() * 20));
        const ruleCount = 1 + Math.floor(next() * 6);
        for (let r = 0; r < ruleCount; r += 1) {
          const len = 1n + BigInt(Math.floor(next() * 35));
          const dest = BigInt(Math.floor(next() * 500));
          triples.push({ dest, src: cursor, len });
          cursor += len + BigInt(Math.floor(next() * 25));
        }
        // Shuffle rule lines deterministically to stress RangeMap sorting.
        for (let i = triples.length - 1; i > 0; i -= 1) {
          const j = Math.floor(next() * (i + 1));
          const tmp = triples[i]!;
          triples[i] = triples[j]!;
          triples[j] = tmp;
        }
        stages.push(triples);
        lines.push('', `c${st}-to-c${st + 1} map:`);
        for (const t of triples) lines.push(`${t.dest} ${t.src} ${t.len}`);
      }

      const almanac = solver.parse(lines.join('\n'));
      const expected = linearScanOracle(seeds, stages);
      expect(solver.solve(almanac)).toBe(expected);
      const frames = solver.trace!(almanac);
      expect(frames[frames.length - 1]!.bestLocation).toBe(expected);
    }
  });
});
