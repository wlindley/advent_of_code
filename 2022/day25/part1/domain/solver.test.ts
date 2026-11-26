import { describe, expect, it } from 'vitest';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '1=-0-2',
  '12111',
  '2=0=',
  '21',
  '2=01',
  '111',
  '20012',
  '112',
  '1=-1=',
  '1-12',
  '12',
  '1=',
  '122',
].join('\n');

const DIGITS = '=-012';

function directColumnAddSnafu(lines: readonly string[]): string {
  let maxLen = 0;
  for (const line of lines) {
    if (line.length > maxLen) maxLen = line.length;
  }
  let carry = 0;
  let out = '';
  for (let col = 0; col < maxLen || carry !== 0; col += 1) {
    let sum = carry;
    for (const line of lines) {
      if (col < line.length) {
        sum += DIGITS.indexOf(line[line.length - 1 - col]!) - 2;
      }
    }
    const rem = ((sum % 5) + 5) % 5;
    const digit = rem > 2 ? rem - 5 : rem;
    carry = (sum - digit) / 5;
    out = DIGITS[digit + 2]! + out;
  }
  const trimmed = out.replace(/^0+/, '');
  return trimmed.length === 0 ? '0' : trimmed;
}

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

describe('2022 Day 25 Part 1 solver', () => {
  it('solves the official 13-line example to 2=-1=0', () => {
    const ledger = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(ledger)).toBe('2=-1=0');
  });

  it('handles brochure values, zero, negative, and BigInt-scale ledgers', () => {
    expect(solver.solve(solver.parse('1=11-2\n1-0---0'))).toBe('10=00=2');
    expect(solver.solve(solver.parse('21\n=0\n-'))).toBe('0');
    expect(solver.solve(solver.parse('=0\n='))).toBe('==');

    const hugeA = '2' + '0'.repeat(28);
    const hugeB = '1' + '='.repeat(28);
    const input = `${hugeA}\n${hugeB}`;
    expect(solver.solve(solver.parse(input))).toBe(directColumnAddSnafu([hugeA, hugeB]));
  });

  it('traces accumulation and encoding steps with bounded maxSteps', () => {
    const ledger = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(ledger);
    expect(full).toHaveLength(19);
    const last = full[full.length - 1]!;
    expect(last.kind === 'encode' && last.partialSnafu).toBe('2=-1=0');

    const bounded = solver.trace(ledger, { maxSteps: 8 });
    expect(bounded).toHaveLength(8);
  });

  it('matches independent base-5 column-addition oracle across 25 seeded ledgers', () => {
    let seed = 20221225;
    for (let trial = 0; trial < 25; trial += 1) {
      seed = nextSeed(seed);
      const lineCount = (seed % 18) + 1;
      const lines: string[] = [];
      for (let i = 0; i < lineCount; i += 1) {
        seed = nextSeed(seed);
        const len = (seed % 26) + 1;
        let line = '';
        for (let j = 0; j < len; j += 1) {
          seed = nextSeed(seed);
          line += DIGITS[seed % 5]!;
        }
        lines.push(line);
      }
      const parsed = solver.parse(lines.join('\n'));
      expect(solver.solve(parsed)).toBe(directColumnAddSnafu(lines));
    }
  });
});
