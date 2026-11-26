import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  asciiDigitExtractor,
  AsciiDigitExtractor,
  DEFAULT_MAX_TRACE_STEPS,
  solver,
} from './index';

const EXAMPLE_INPUT = `1abc2
pqr3stu8vwx
a1b2c3d4e5f
treb7uchet`;

function singlePassLinearOracle(raw: string): number {
  let total = 0;
  for (const line of raw.trim().split(/\r?\n/)) {
    let first = -1;
    let last = -1;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i]!;
      if (ch >= '0' && ch <= '9') {
        const d = ch.charCodeAt(0) - 48;
        if (first === -1) first = d;
        last = d;
      }
    }
    total += first * 10 + last;
  }
  return total;
}

describe('AsciiDigitExtractor', () => {
  it('matches ASCII 0..9 within bounds and returns null otherwise', () => {
    const extractor = new AsciiDigitExtractor();
    expect(extractor.matchAt('0/9:', 0)?.value).toBe(0);
    expect(extractor.matchAt('0/9:', 1)).toBeNull();
    expect(extractor.matchAt('0/9:', 2)?.value).toBe(9);
    expect(extractor.matchAt('0/9:', 3)).toBeNull();
    expect(extractor.matchAt('12', -1)).toBeNull();
    expect(extractor.matchAt('12', 2)).toBeNull();
    expect(extractor.matchAt('12', 0.5)).toBeNull();
    expect(Object.isFrozen(asciiDigitExtractor)).toBe(true);
  });
});

describe('2023 day 01 part 1 solver', () => {
  it('solves the official example to 142 directly and via executeSolver', () => {
    const doc = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(doc)).toBe(142);

    let tick = 10;
    const result = executeSolver(solver, EXAMPLE_INPUT, { nowMs: () => (tick += 5) });
    expect(result).toEqual({ answer: 142, elapsedMs: 5, runtime: 'main-thread' });
  });

  it('handles single-digit lines, zero digits, spelled-word decoys, and digitless errors', () => {
    const doc = solver.parse('x0y\none7two\n9\n0five0');
    expect(solver.solve(doc)).toBe(0 + 77 + 99 + 0);

    const noDigits = solver.parse('one\ntwo');
    expect(() => solver.solve(noDigits)).toThrow('Line 1: no calibration digit found in "one"');
  });

  it('emits full and sampled trace frames accurately', () => {
    const doc = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(doc);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    expect(frames).toHaveLength(4);
    expect(frames[3]?.calibration.value).toBe(77);
    expect(frames[3]?.runningSum).toBe(142);

    const large = solver.parse(Array.from({ length: 250 }, (_, i) => `k${i % 10}m`).join('\n'));
    const sampled = solver.trace!(large, { maxSteps: 20 });
    expect(sampled).toHaveLength(20);
    expect(sampled.at(-1)?.runningSum).toBe(solver.solve(large));
  });

  it('matches deterministic single-pass-linear differential oracle up to 1000 lines', () => {
    const words = ['one', 'two', 'three', 'seven', 'nine', 'abc', 'xyz'];
    let seed = 0x1234567;
    const lines: string[] = [];
    for (let i = 0; i < 1000; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const d1 = seed % 10;
      const d2 = (seed >>> 8) % 10;
      const w = words[seed % words.length]!;
      lines.push(i % 5 === 0 ? `${w}${d1}${w}` : `${w}${d1}q${w}${d2}z`);
    }
    const raw = lines.join('\n');
    expect(solver.solve(solver.parse(raw))).toBe(singlePassLinearOracle(raw));
  });
});
