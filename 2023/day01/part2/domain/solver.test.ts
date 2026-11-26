import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, solver } from './index';

const EXAMPLE_INPUT = `two1nine
eightwothree
abcone2threexyz
xtwone3four
4nineeightseven2
zoneight234
7pqrstsixteen`;

const ORACLE_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function bruteForceOracle(raw: string): number {
  let total = 0;
  for (const line of raw.trim().split(/\r?\n/)) {
    let first = -1;
    let last = -1;
    for (let i = 0; i < line.length; i += 1) {
      let digit = -1;
      const code = line.charCodeAt(i);
      if (code >= 48 && code <= 57) {
        digit = code - 48;
      } else {
        for (let w = 0; w < ORACLE_WORDS.length; w += 1) {
          if (line.startsWith(ORACLE_WORDS[w]!, i)) {
            digit = w + 1;
            break;
          }
        }
      }
      if (digit !== -1) {
        if (first === -1) first = digit;
        last = digit;
      }
    }
    total += first * 10 + last;
  }
  return total;
}

describe('2023 day 01 part 2 solver', () => {
  it('solves the official 7-line example to 281 directly and via executeSolver', () => {
    const doc = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(doc)).toBe(281);

    let tick = 100;
    const fakeClock: Clock = { nowMs: () => (tick += 7) };
    const result = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(result).toEqual({ answer: 281, elapsedMs: 7, runtime: 'main-thread' });
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('resolves all 8 overlapping word pairs and chained overlaps', () => {
    const pairs: readonly (readonly [string, number])[] = [
      ['oneight', 18],
      ['twone', 21],
      ['threeight', 38],
      ['fiveight', 58],
      ['sevenine', 79],
      ['eightwo', 82],
      ['eighthree', 83],
      ['nineight', 98],
    ];
    for (const [text, expected] of pairs) {
      expect(solver.solve(solver.parse(text))).toBe(expected);
    }
    expect(solver.solve(solver.parse('oneightwo\ntwoneighthree\neightwone'))).toBe(12 + 23 + 81);
  });

  it('handles ASCII 0 with words and single-digit reuse', () => {
    const doc = solver.parse('0one\none0\n0zero\ntrebuchetone\nfive\n7');
    expect(solver.solve(doc)).toBe(1 + 10 + 0 + 11 + 55 + 77);
  });

  it('rejects empty, blank interior, wordless, and invalid trace inputs', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('one\n\ntwo')).toThrow('Line 2');
    for (const bad of ['zero', 'ONE', 'onthr', 'seve', 'eigh']) {
      expect(() => solver.solve(solver.parse(bad))).toThrow('no calibration digit found');
    }
    const doc = solver.parse('one');
    for (const badMax of [0, -1, 1.5, Number.NaN]) {
      expect(() => solver.trace!(doc, { maxSteps: badMax })).toThrow();
    }
  });

  it('bounds trace frames and preserves exact running sums', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const exDoc = solver.parse(EXAMPLE_INPUT);
    const exFrames = solver.trace!(exDoc);
    expect(exFrames).toHaveLength(7);
    expect(exFrames[0]?.calibration.value).toBe(29);
    expect(exFrames[6]?.totalLines).toBe(7);
    expect(exFrames[6]?.runningSum).toBe(281);

    const lines = Array.from({ length: 250 }, (_, i) => `x${ORACLE_WORDS[i % 9]}y${i % 10}`);
    const large = solver.parse(lines.join('\n'));
    const sampled = solver.trace!(large, { maxSteps: 20 });
    expect(sampled).toHaveLength(20);
    expect(sampled.at(-1)?.runningSum).toBe(solver.solve(large));
  });

  it('matches an independent brute-force oracle across 1,000 deterministic LCG lines', () => {
    const tokens = [...ORACLE_WORDS, 'zero', 'twone', 'oneight', '0', '9', 'abc', 'eigh'];
    let seed = 0x9e3779b9;
    const lines: string[] = [];
    for (let i = 0; i < 1000; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const a = tokens[seed % tokens.length]!;
      const b = tokens[(seed >>> 6) % tokens.length]!;
      const d = (seed >>> 12) % 10;
      lines.push(i % 7 === 0 ? `${a}x${d}` : `${a}${b}q${d}${a}`);
    }
    const raw = lines.join('\n');
    expect(solver.solve(solver.parse(raw))).toBe(bruteForceOracle(raw));
  });
});
