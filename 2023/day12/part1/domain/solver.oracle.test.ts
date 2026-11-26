import { describe, expect, it } from 'vitest';
import {
  buildArrangementDpTable,
  countArrangements,
  parseSpringRecords,
  reconstructWitness,
  SpringRecord,
} from '../../shared';

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

function buildNfaTemplate(groups: readonly number[]): string {
  let template = '.';
  for (const size of groups) template += `${'#'.repeat(size)}.`;
  return template;
}

function stepNfaStates(dp: readonly bigint[], ch: string, template: string): bigint[] {
  const next = new Array<bigint>(template.length).fill(0n);
  const allowDot = ch === '.' || ch === '?';
  const allowHash = ch === '#' || ch === '?';
  for (let s = 0; s < template.length; s += 1) {
    const ways = dp[s]!;
    if (ways === 0n) continue;
    if (allowDot && template[s] === '.') next[s] = next[s]! + ways;
    if (allowDot && s + 1 < template.length && template[s + 1] === '.') next[s + 1] = next[s + 1]! + ways;
    if (allowHash && s + 1 < template.length && template[s + 1] === '#') next[s + 1] = next[s + 1]! + ways;
  }
  return next;
}

function nfaOracleCount(record: SpringRecord): bigint {
  const template = buildNfaTemplate(record.groups);
  let dp = new Array<bigint>(template.length).fill(0n);
  dp[0] = 1n;
  for (let i = 0; i < record.pattern.length; i += 1) dp = stepNfaStates(dp, record.pattern[i]!, template);
  const last = template.length - 1;
  return template.length >= 2 ? dp[last]! + dp[last - 1]! : dp[last]!;
}

function extractHashRuns(concrete: string): number[] {
  const runs: number[] = [];
  let current = 0;
  for (let i = 0; i < concrete.length; i += 1) {
    if (concrete[i] === '#') current += 1;
    else if (current > 0) { runs.push(current); current = 0; }
  }
  if (current > 0) runs.push(current);
  return runs;
}

function arraysEqual(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function bruteForceOracleCount(record: SpringRecord): bigint {
  const wildcards: number[] = [];
  for (let i = 0; i < record.pattern.length; i += 1) if (record.pattern[i] === '?') wildcards.push(i);
  let count = 0n;
  const totalMasks = 1 << wildcards.length;
  for (let mask = 0; mask < totalMasks; mask += 1) {
    const chars = record.pattern.split('');
    for (let bit = 0; bit < wildcards.length; bit += 1) {
      chars[wildcards[bit]!] = (mask & (1 << bit)) === 0 ? '.' : '#';
    }
    if (arraysEqual(extractHashRuns(chars.join('')), record.groups)) count += 1n;
  }
  return count;
}

function assertValidWitness(record: SpringRecord, witness: string | null, count: bigint): void {
  if (count === 0n) { expect(witness).toBeNull(); return; }
  expect(witness).not.toBeNull();
  expect(witness).toHaveLength(record.length);
  for (let i = 0; i < record.length; i += 1) {
    const ch = witness![i]!;
    expect(ch === '.' || ch === '#').toBe(true);
    if (record.pattern[i] !== '?') expect(ch).toBe(record.pattern[i]);
  }
  expect(extractHashRuns(witness!)).toEqual([...record.groups]);
}

function randomRecord(rng: LcgRng, maxLen: number, maxWildcards: number): SpringRecord {
  const alphabet = ['.', '#', '?'];
  const len = 1 + rng.nextInt(maxLen);
  let wildcards = 0;
  let pattern = '';
  for (let i = 0; i < len; i += 1) {
    const pick = wildcards >= maxWildcards ? rng.nextInt(2) : rng.nextInt(3);
    if (pick === 2) wildcards += 1;
    pattern += alphabet[pick]!;
  }
  const groupCount = rng.nextInt(Math.min(4, Math.ceil(len / 2) + 1));
  const groups: number[] = [];
  for (let g = 0; g < groupCount; g += 1) groups.push(1 + rng.nextInt(3));
  return new SpringRecord(pattern, groups);
}

describe('Day 12 differential & brute-force oracles', () => {
  it('matches forward NFA automaton DP on all 6 official rows (1x and 5x)', () => {
    const records = parseSpringRecords(EXAMPLE_INPUT);
    let total5x = 0n;
    for (const rec of records) {
      expect(countArrangements(rec)).toBe(nfaOracleCount(rec));
      const ways5x = countArrangements(rec.unfold(5));
      expect(ways5x).toBe(nfaOracleCount(rec.unfold(5)));
      total5x += ways5x;
    }
    expect(total5x).toBe(525152n);
  });

  it('matches NFA DP on 40 seeded PRNG records at 1x and 5x', () => {
    const rng = new LcgRng(20231201);
    for (let i = 0; i < 40; i += 1) {
      const rec = randomRecord(rng, 14, 14);
      expect(countArrangements(rec)).toBe(nfaOracleCount(rec));
      const unfolded = rec.unfold(5);
      expect(countArrangements(unfolded)).toBe(nfaOracleCount(unfolded));
    }
  });

  it('matches 2^Q brute-force enumeration and validates reconstructWitness on 60 seeded rows', () => {
    const rng = new LcgRng(20231202);
    for (let i = 0; i < 60; i += 1) {
      const rec = randomRecord(rng, 12, 10);
      const expected = bruteForceOracleCount(rec);
      const table = buildArrangementDpTable(rec);
      expect(countArrangements(rec)).toBe(expected);
      expect(table[0]![0]).toBe(expected);
      assertValidWitness(rec, reconstructWitness(rec, table), expected);
    }
  });
});
