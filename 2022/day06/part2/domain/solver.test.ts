import { describe, expect, it } from 'vitest';
import { bitCount, executeSolver, type Clock } from '../../../../shared/core';
import { ASCII_LOWER_A } from '../../shared';
import { MESSAGE_MARKER_LENGTH, solver } from '.';

const PART_2_EXAMPLES: readonly (readonly [string, number])[] = [
  ['mjqjpqmgbljsphdztnvjfqwrcgsmlb', 19],
  ['bvwbjplbgvbhsrlpgdmjqwftvncz', 23],
  ['nppdvjthqldpwncqszvftbrmjlhg', 23],
  ['nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg', 29],
  ['zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw', 26],
];

function createFakeClock(timesMs: readonly number[]): Clock {
  let idx = 0;
  return {
    nowMs: () => {
      const value = timesMs[idx] ?? timesMs[timesMs.length - 1] ?? 0;
      idx += 1;
      return value;
    },
  };
}

function directSetWindowOracle(signal: string, windowSize: number): number | null {
  for (let end = windowSize; end <= signal.length; end += 1) {
    if (new Set(signal.slice(end - windowSize, end)).size === windowSize) {
      return end;
    }
  }
  return null;
}

function xorBitmaskWindowOracle(signal: string, windowSize: number): number | null {
  let mask = 0n;
  for (let i = 0; i < signal.length; i += 1) {
    mask ^= 1n << BigInt(signal.charCodeAt(i) - ASCII_LOWER_A);
    if (i >= windowSize) {
      mask ^= 1n << BigInt(signal.charCodeAt(i - windowSize) - ASCII_LOWER_A);
    }
    if (i >= windowSize - 1 && bitCount(mask) === windowSize) {
      return i + 1;
    }
  }
  return null;
}

function nextSeededInt(state: { value: number }, modulus: number): number {
  state.value = (Math.imul(state.value, 1664525) + 1013904223) >>> 0;
  return state.value % modulus;
}

function generateSignal(state: { value: number }, length: number, alphabetSpan: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += String.fromCharCode(ASCII_LOWER_A + nextSeededInt(state, alphabetSpan));
  }
  return out;
}

describe('2022 Day 6 Part 2 solver', () => {
  it('uses MESSAGE_MARKER_LENGTH = 14', () => {
    expect(MESSAGE_MARKER_LENGTH).toBe(14);
  });

  it('solves all five official Part 2 examples with trimming', () => {
    for (const [input, expected] of PART_2_EXAMPLES) {
      expect(solver.solve(solver.parse(`  ${input}\r\n`))).toBe(expected);
    }
  });

  it('handles immediate, end-of-stream, and stale lastSeen boundaries', () => {
    expect(solver.solve(solver.parse('abcdefghijklmn'))).toBe(14);
    expect(solver.solve(solver.parse(`${'a'.repeat(14)}bcdefghijklmn`))).toBe(27);
    expect(solver.solve(solver.parse('abcdefghijklmban'))).toBe(16);
  });

  it('rejects empty input with RangeError', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
  });

  it('rejects whitespace-only input with RangeError', () => {
    expect(() => solver.parse('  \t\n  ')).toThrow(RangeError);
  });

  it('rejects multiline input with RangeError', () => {
    expect(() => solver.parse('abcdefghijklmn\nopqrst')).toThrow(RangeError);
  });

  it('rejects uppercase letters with RangeError', () => {
    expect(() => solver.parse('ABCDEFGHIJKLMN')).toThrow(RangeError);
  });

  it('rejects non-letter characters with RangeError', () => {
    expect(() => solver.parse('abcdefghijklm1')).toThrow(RangeError);
  });

  it('rejects streams shorter than 14 characters with RangeError', () => {
    expect(() => solver.solve(solver.parse('abcdefghijklm'))).toThrow(RangeError);
  });

  it('rejects repeated single-character stream with RangeError', () => {
    expect(() => solver.solve(solver.parse('a'.repeat(20)))).toThrow(RangeError);
  });

  it('rejects 13-letter cyclic marker-less stream with RangeError', () => {
    expect(() => solver.solve(solver.parse('abcdefghijklm'.repeat(3)))).toThrow(RangeError);
  });

  it('runs through executeSolver with a hand-written fake Clock', () => {
    const result = executeSolver(solver, PART_2_EXAMPLES[0]![0], createFakeClock([12, 19.25]));
    expect(result).toEqual({ answer: 19, elapsedMs: 7.25, runtime: 'main-thread' });
  });

  it('traces example 5 until locked at the start-of-message marker', () => {
    const frames = solver.trace(solver.parse(PART_2_EXAMPLES[4]![0]));
    const final = frames.at(-1)!;
    expect(final.isMarkerFound).toBe(true);
    expect(final.position).toBe(26);
    expect(final.windowLength).toBe(MESSAGE_MARKER_LENGTH);
    expect(final.windowText).toBe('jwzlrfnpqdbhtm');
  });

  it('caps trace frames with maxSteps on a 4,096-char synthetic stream', () => {
    const stream = `${'abcdefghijklm'.repeat(314)}abcdefghijklmn`;
    expect(stream.length).toBe(4096);
    const frames = solver.trace(solver.parse(stream), { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames.at(-1)!.position).toBe(4096);
    expect(frames.at(-1)!.isMarkerFound).toBe(true);
    expect(frames.at(-1)!.windowText).toBe('abcdefghijklmn');
  });

  it('matches both differential oracles across 40 deterministic seeded streams', () => {
    const state = { value: 202212062 };
    for (let i = 0; i < 40; i += 1) {
      const alphabetSpan = i % 4 === 0 ? 13 : 26;
      const len = i % 8 === 0 ? 4096 : 14 + nextSeededInt(state, 90);
      const signal = generateSignal(state, len, alphabetSpan);
      const parsed = solver.parse(signal);
      const setExpected = directSetWindowOracle(signal, MESSAGE_MARKER_LENGTH);
      const xorExpected = xorBitmaskWindowOracle(signal, MESSAGE_MARKER_LENGTH);
      expect(xorExpected).toBe(setExpected);
      if (setExpected === null) {
        expect(() => solver.solve(parsed)).toThrow(RangeError);
      } else {
        expect(solver.solve(parsed)).toBe(setExpected);
      }
    }
  });
});
