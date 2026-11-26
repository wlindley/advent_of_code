import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_INVALID = [
  'eyr:1972 cid:100\nhcl:#18171d ecl:amb hgt:170 pid:186cm iyr:2018 byr:1926',
  'iyr:2019\nhcl:#602927 eyr:1967 hgt:170cm\necl:grn pid:012533040 byr:1946',
  'hcl:dab227 iyr:2012\necl:brn hgt:182cm pid:021572410 eyr:2020 byr:1992 cid:277',
  'hgt:59cm ecl:zzz\neyr:2038 hcl:74454a iyr:2023\npid:3556412378 byr:2007',
].join('\n\n');

const OFFICIAL_VALID = [
  'pid:087499704 hgt:74in ecl:grn iyr:2012 eyr:2030 byr:1980\nhcl:#623a2f',
  'eyr:2029 ecl:blu cid:129 byr:1989\niyr:2014 pid:896056539 hcl:#a97842 hgt:165cm',
  'hcl:#888785\nhgt:164cm byr:2001 iyr:2015 cid:88\npid:545766238 ecl:hzl\neyr:2022',
  'iyr:2010 hgt:158cm hcl:#b6652a ecl:blu byr:1944 eyr:2021 pid:093154719',
].join('\n\n');

const OFFICIAL_COMBINED = `${OFFICIAL_INVALID}\n\n${OFFICIAL_VALID}`;

const BASE_FIELDS: Readonly<Record<string, string>> = {
  byr: '1980', iyr: '2015', eyr: '2025', hgt: '170cm', hcl: '#123abc', ecl: 'brn', pid: '000000001',
};

const FIELD_BOUNDARIES: readonly (readonly [string, string, number])[] = [
  ['byr', '1919', 0], ['byr', '1920', 1], ['byr', '2002', 1], ['byr', '2003', 0], ['byr', '01980', 0], ['byr', '198a', 0],
  ['iyr', '2009', 0], ['iyr', '2010', 1], ['iyr', '2020', 1], ['iyr', '2021', 0],
  ['eyr', '2019', 0], ['eyr', '2020', 1], ['eyr', '2030', 1], ['eyr', '2031', 0],
  ['hgt', '149cm', 0], ['hgt', '150cm', 1], ['hgt', '190cm', 1], ['hgt', '193cm', 1], ['hgt', '194cm', 0],
  ['hgt', '58in', 0], ['hgt', '59in', 1], ['hgt', '60in', 1], ['hgt', '76in', 1], ['hgt', '77in', 0],
  ['hgt', '190in', 0], ['hgt', '190', 0], ['hgt', '0150cm', 0], ['hgt', '059in', 0], ['hgt', '170CM', 0], ['hgt', '65IN', 0],
  ['hcl', '#123abc', 1], ['hcl', '#123abz', 0], ['hcl', '123abc', 0], ['hcl', '#123ABC', 0], ['hcl', '#123ab', 0], ['hcl', '#123abcd', 0],
  ['ecl', 'amb', 1], ['ecl', 'blu', 1], ['ecl', 'brn', 1], ['ecl', 'gry', 1], ['ecl', 'grn', 1], ['ecl', 'hzl', 1], ['ecl', 'oth', 1],
  ['ecl', 'wat', 0], ['ecl', 'AMB', 0],
  ['pid', '000000001', 1], ['pid', '0123456789', 0], ['pid', '12345678', 0], ['pid', '12345678a', 0],
];

const ECL_VALID = ['amb', 'blu', 'brn', 'gry', 'grn', 'hzl', 'oth'] as const;
const ORACLE_KEYS = ['byr', 'iyr', 'eyr', 'hgt', 'hcl', 'ecl', 'pid'] as const;
const INVALID_SAMPLES: Readonly<Record<string, string>> = {
  byr: '2003', iyr: '2021', eyr: '2019', hgt: '0150cm', hcl: '#123abz', ecl: 'wat', pid: '0123456789',
};

function makePassport(overrides: Readonly<Record<string, string | undefined>>): string {
  const merged: Record<string, string | undefined> = { ...BASE_FIELDS, ...overrides };
  return Object.entries(merged)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([key, value]) => `${key}:${value}`)
    .join(' ');
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function buildSyntheticStrictBatch(count: number): string {
  const blocks: string[] = [];
  let seed = 20200402;
  for (let i = 0; i < count; i += 1) {
    seed = nextSeed(seed);
    const fields: Record<string, string | undefined> = {
      byr: String(1920 + (seed % 83)),
      iyr: String(2010 + (seed % 11)),
      eyr: String(2020 + (seed % 11)),
      hgt: i % 2 === 0 ? `${150 + (seed % 44)}cm` : `${59 + (seed % 18)}in`,
      hcl: `#${((seed % 0xffffff) + 0x1000000).toString(16).slice(1)}`,
      ecl: ECL_VALID[seed % ECL_VALID.length]!,
      pid: String(seed % 1_000_000_000).padStart(9, '0'),
      cid: seed % 3 === 0 ? String(seed % 500) : undefined,
    };
    if (seed % 2 === 0) {
      const target = ORACLE_KEYS[(seed >>> 3) % ORACLE_KEYS.length]!;
      fields[target] = (seed >>> 6) % 4 === 0 ? undefined : INVALID_SAMPLES[target];
    }
    blocks.push(makePassport(fields));
  }
  return blocks.join('\n\n');
}

function yearInRange(val: string | undefined, min: number, max: number): boolean {
  return val !== undefined && /^\d{4}$/.test(val) && Number(val) >= min && Number(val) <= max;
}

function isStrictFieldValid(fields: Readonly<Record<string, string>>): boolean {
  const hgtMatch = fields.hgt ? /^([1-9]\d*)(cm|in)$/.exec(fields.hgt) : null;
  const hgtOk = hgtMatch !== null && (hgtMatch[2] === 'cm'
    ? Number(hgtMatch[1]) >= 150 && Number(hgtMatch[1]) <= 193
    : Number(hgtMatch[1]) >= 59 && Number(hgtMatch[1]) <= 76);
  return (
    yearInRange(fields.byr, 1920, 2002) &&
    yearInRange(fields.iyr, 2010, 2020) &&
    yearInRange(fields.eyr, 2020, 2030) &&
    hgtOk &&
    /^#[0-9a-f]{6}$/.test(fields.hcl ?? '') &&
    /^(?:amb|blu|brn|gry|grn|hzl|oth)$/.test(fields.ecl ?? '') &&
    /^\d{9}$/.test(fields.pid ?? '')
  );
}

function independentStrictPassportOracle(raw: string): number {
  let valid = 0;
  for (const block of raw.trim().split(/\n\s*\n/)) {
    const fields: Record<string, string> = {};
    for (const token of block.trim().split(/\s+/)) {
      const idx = token.indexOf(':');
      fields[token.slice(0, idx)] = token.slice(idx + 1);
    }
    if (isStrictFieldValid(fields)) valid += 1;
  }
  return valid;
}

describe('2020 day04 part2 solver', () => {
  it('solves the official invalid, valid, and combined examples', () => {
    expect(solver.solve(solver.parse(OFFICIAL_INVALID))).toBe(0);
    expect(solver.solve(solver.parse(OFFICIAL_VALID))).toBe(4);
    expect(solver.solve(solver.parse(OFFICIAL_COMBINED))).toBe(4);
    expect(executeSolver(solver, OFFICIAL_COMBINED).answer).toBe(4);
  });

  it('validates all 13 official field examples and boundary matrix', () => {
    for (const [field, value, expected] of FIELD_BOUNDARIES) {
      const raw = makePassport({ [field]: value });
      expect(solver.solve(solver.parse(raw)), `${field}:${value}`).toBe(expected);
    }
  });

  it('handles structural edge cases: missing field, optional cid, unknown field, and CRLF', () => {
    expect(solver.solve(solver.parse(makePassport({ byr: undefined })))).toBe(0);
    expect(solver.solve(solver.parse(makePassport({ cid: '999' })))).toBe(1);
    expect(solver.solve(solver.parse(makePassport({ foo: 'bar' })))).toBe(1);
    expect(solver.solve(solver.parse(OFFICIAL_COMBINED.replace(/\n/g, '\r\n')))).toBe(4);
  });

  it('produces full and downsampled traces and rejects invalid maxSteps', () => {
    const batch = solver.parse(OFFICIAL_COMBINED);
    const full = solver.trace!(batch);
    const capped = solver.trace!(batch, { maxSteps: 3 });

    expect(full).toHaveLength(8);
    expect(full[7]?.validSoFar).toBe(4);
    expect(capped.map((frame) => frame.recordIndex)).toEqual([0, 4, 7]);
    expect(capped[2]?.validSoFar).toBe(4);
    expect(() => solver.trace!(batch, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('propagates parse errors on empty, malformed, and duplicate-key inputs', () => {
    expect(() => solver.parse('  \r\n ')).toThrow(RangeError);
    expect(() => solver.parse('byr:1980 badtoken')).toThrow(SyntaxError);
    expect(() => solver.parse('byr:1980 byr:1981')).toThrow(SyntaxError);
  });

  it('matches an independent strict oracle across 60 seeded synthetic passports', () => {
    const raw = buildSyntheticStrictBatch(60);
    const actual = solver.solve(solver.parse(raw));
    expect(actual).toBeGreaterThan(0);
    expect(actual).toBeLessThan(60);
    expect(actual).toBe(independentStrictPassportOracle(raw));
  });
});
