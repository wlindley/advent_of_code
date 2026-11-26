import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'ecl:gry pid:860033327 eyr:2020 hcl:#fffffd',
  'byr:1937 iyr:2017 cid:147 hgt:183cm',
  '',
  'iyr:2013 ecl:amb cid:350 eyr:2023 pid:028048884',
  'hcl:#cfa07d byr:1929',
  '',
  'hcl:#ae17e1 iyr:2013',
  'eyr:2024',
  'ecl:brn pid:760753108 byr:1931',
  'hgt:179cm',
  '',
  'hcl:#cfa07d eyr:2025 pid:166559648',
  'iyr:2011 ecl:brn hgt:59in',
].join('\n');

const ORACLE_KEYS = ['byr', 'iyr', 'eyr', 'hgt', 'hcl', 'ecl', 'pid'] as const;

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function buildSyntheticBatchText(count: number): string {
  const blocks: string[] = [];
  let seed = 202004;
  for (let i = 0; i < count; i += 1) {
    const tokens: string[] = [];
    for (const key of ORACLE_KEYS) {
      seed = nextSeed(seed);
      if (seed % 5 !== 0) tokens.push(`${key}:v${seed % 97}`);
    }
    seed = nextSeed(seed);
    if (seed % 2 === 0) tokens.push(`cid:${seed % 500}`);
    if (tokens.length === 0) tokens.push('cid:1');
    blocks.push(tokens.join(i % 2 === 0 ? ' ' : '\n'));
  }
  return blocks.join('\n\n');
}

function flatRegexPresenceOracle(raw: string): number {
  const blocks = raw.trim().split(/\n\s*\n/);
  let valid = 0;
  for (const block of blocks) {
    let ok = true;
    for (const key of ORACLE_KEYS) {
      if (!new RegExp(`(?:^|\\s)${key}:\\S+`).test(block)) ok = false;
    }
    if (ok) valid += 1;
  }
  return valid;
}

describe('2020 day04 part1 solver', () => {
  it('solves the official 4-passport example and runs via executeSolver', () => {
    const batch = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(batch)).toBe(2);
    expect(executeSolver(solver, OFFICIAL_EXAMPLE).answer).toBe(2);
  });

  it('produces full and downsampled traces with and without TraceOptions', () => {
    const batch = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace!(batch);
    const capped = solver.trace!(batch, { maxSteps: 2 });

    expect(full).toHaveLength(4);
    expect(full[3]?.validSoFar).toBe(2);
    expect(capped.map((frame) => frame.recordIndex)).toEqual([0, 3]);
    expect(capped[1]?.validSoFar).toBe(2);
  });

  it('propagates parse errors on empty or malformed raw inputs', () => {
    expect(() => solver.parse('   \n  ')).toThrow(RangeError);
    expect(() => solver.parse('byr:1980 badtoken')).toThrow(SyntaxError);
  });

  it('matches an independent flat-regex oracle across 40 seeded synthetic passports', () => {
    const raw = buildSyntheticBatchText(40);
    const actual = solver.solve(solver.parse(raw));
    expect(actual).toBe(flatRegexPresenceOracle(raw));
  });
});
