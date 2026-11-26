import { describe, expect, it } from 'vitest';
import { buildArrangementDpTable, countArrangements, reconstructWitness, SpringRecord } from '../../shared';
import { PART2_UNFOLD_FACTOR, solver } from './index';

const EXAMPLE_INPUT = [
  '???.### 1,1,3',
  '.??..??...?##. 1,1,3',
  '?#?#?#?#?#?#?#? 1,3,1,6',
  '????.#...#... 4,1,1',
  '????.######..#####. 1,6,5',
  '?###???????? 3,2,1',
].join('\n');

class LcgRng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  nextInt(bound: number): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state % bound;
  }
}

class TopDownMemoOracle {
  private readonly pattern: string;
  private readonly groups: readonly number[];
  private readonly strideG: number;
  private readonly strideR: number;
  private readonly memo = new Map<number, bigint>();

  constructor(record: SpringRecord) {
    this.pattern = record.pattern;
    this.groups = record.groups;
    this.strideG = record.groups.length + 1;
    let maxGroup = 0;
    for (const group of record.groups) if (group > maxGroup) maxGroup = group;
    this.strideR = maxGroup + 1;
  }

  count(): bigint { return this.dfs(0, 0, 0); }

  private isTerminalValid(groupIdx: number, currentRun: number): boolean {
    return (
      (groupIdx === this.groups.length && currentRun === 0) ||
      (groupIdx === this.groups.length - 1 && currentRun === this.groups[groupIdx])
    );
  }

  private dfs(pos: number, groupIdx: number, currentRun: number): bigint {
    if (pos === this.pattern.length) return this.isTerminalValid(groupIdx, currentRun) ? 1n : 0n;
    const key = (pos * this.strideG + groupIdx) * this.strideR + currentRun;
    const cached = this.memo.get(key);
    if (cached !== undefined) return cached;
    const ch = this.pattern[pos]!;
    let ways = 0n;
    if (ch === '.' || ch === '?') {
      if (currentRun === 0) ways += this.dfs(pos + 1, groupIdx, 0);
      else if (currentRun === this.groups[groupIdx]) ways += this.dfs(pos + 1, groupIdx + 1, 0);
    }
    if ((ch === '#' || ch === '?') && groupIdx < this.groups.length && currentRun < this.groups[groupIdx]!) {
      ways += this.dfs(pos + 1, groupIdx, currentRun + 1);
    }
    this.memo.set(key, ways);
    return ways;
  }
}

function binomial(n: number, k: number): bigint {
  if (n < k || k < 0) return 0n;
  const r = Math.min(k, n - k);
  let num = 1n;
  for (let i = 1; i <= r; i += 1) num = (num * BigInt(n - r + i)) / BigInt(i);
  return num;
}

function extractHashRuns(concrete: string): number[] {
  const runs: number[] = [];
  let run = 0;
  for (let i = 0; i < concrete.length; i += 1) {
    if (concrete[i] === '#') run += 1;
    else if (run > 0) { runs.push(run); run = 0; }
  }
  if (run > 0) runs.push(run);
  return runs;
}

function assertValidWitness(record: SpringRecord, expectedCount: bigint): void {
  const table = buildArrangementDpTable(record);
  expect(table[0]![0]).toBe(expectedCount);
  const witness = reconstructWitness(record, table);
  if (expectedCount === 0n) { expect(witness).toBeNull(); return; }
  expect(witness).toHaveLength(record.length);
  for (let i = 0; i < record.length; i += 1) {
    const ch = witness![i]!;
    expect(ch === '.' || ch === '#').toBe(true);
    if (record.pattern[i] !== '?') expect(ch).toBe(record.pattern[i]);
  }
  expect(extractHashRuns(witness!)).toEqual([...record.groups]);
}

function randomRecord(rng: LcgRng, maxLen: number): SpringRecord {
  const alphabet = ['.', '#', '?'];
  const len = 1 + rng.nextInt(maxLen);
  let pattern = '';
  for (let i = 0; i < len; i += 1) pattern += alphabet[rng.nextInt(3)]!;
  const groupCount = 1 + rng.nextInt(Math.max(1, Math.min(4, Math.ceil(len / 2))));
  const groups: number[] = [];
  for (let g = 0; g < groupCount; g += 1) groups.push(1 + rng.nextInt(3));
  return new SpringRecord(pattern, groups);
}

describe('Day 12 Part 2 independent differential oracles', () => {
  it('matches TopDownMemoOracle on all 6 official 5x unfolded rows', () => {
    const records = solver.parse(EXAMPLE_INPUT);
    let total = 0n;
    for (const rec of records) {
      const unfolded = rec.unfold(PART2_UNFOLD_FACTOR);
      const expected = new TopDownMemoOracle(unfolded).count();
      expect(countArrangements(unfolded)).toBe(expected);
      total += expected;
    }
    expect(total).toBe(525152n);
  });

  it('matches closed-form binomial(L\' - sum(G\') + 1, |G\'|) on ?-only 5x rows', () => {
    for (const line of ['??? 1', '???? 1,1', '??????? 2,1', '???????????????????? 1,1,1,1', '?? 3']) {
      const unfolded = solver.parse(line)[0]!.unfold(PART2_UNFOLD_FACTOR);
      let groupSum = 0;
      for (const size of unfolded.groups) groupSum += size;
      const expected = binomial(unfolded.length - groupSum + 1, unfolded.groupCount);
      expect(solver.solve(solver.parse(line))).toBe(expected);
      expect(new TopDownMemoOracle(unfolded).count()).toBe(expected);
    }
  });

  it('handles cross-boundary # bridging and impossible 0n rows under 5x unfolding', () => {
    const cases: ReadonlyArray<readonly [string, bigint]> = [
      ['#?? 2', 16n], ['??# 2', 16n], ['?# 2', 1n],
      ['### 2', 0n], ['## 3', 0n], ['### 1,1', 0n], ['... 1', 0n],
    ];
    for (const [line, expected] of cases) {
      const unfolded = solver.parse(line)[0]!.unfold(PART2_UNFOLD_FACTOR);
      expect(solver.solve(solver.parse(line))).toBe(expected);
      expect(new TopDownMemoOracle(unfolded).count()).toBe(expected);
      assertValidWitness(unfolded, expected);
    }
  });

  it('matches TopDownMemoOracle and validates witnesses on 35 seeded 5x records', () => {
    const rng = new LcgRng(20231212);
    for (let i = 0; i < 35; i += 1) {
      const unfolded = randomRecord(rng, 10).unfold(PART2_UNFOLD_FACTOR);
      const expected = new TopDownMemoOracle(unfolded).count();
      expect(countArrangements(unfolded)).toBe(expected);
      if (i % 5 === 0) assertValidWitness(unfolded, expected);
    }
  });
});
