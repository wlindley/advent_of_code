import { describe, expect, it } from 'vitest';
import { bitCount } from '../../../shared/core';
import { ASCII_LOWER_A, DatastreamBuffer } from './buffer';
import { findMarkerPosition, validateWindowSize } from './marker';

const PART_1_EXAMPLES: readonly (readonly [string, number])[] = [
  ['mjqjpqmgbljsphdztnvjfqwrcgsmlb', 7],
  ['bvwbjplbgvbhsrlpgdmjqwftvncz', 5],
  ['nppdvjthqldpwncqszvftbrmjlhg', 6],
  ['nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg', 10],
  ['zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw', 11],
];

const PART_2_EXAMPLES: readonly (readonly [string, number])[] = [
  ['mjqjpqmgbljsphdztnvjfqwrcgsmlb', 19],
  ['bvwbjplbgvbhsrlpgdmjqwftvncz', 23],
  ['nppdvjthqldpwncqszvftbrmjlhg', 23],
  ['nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg', 29],
  ['zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw', 26],
];

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

describe('validateWindowSize', () => {
  it('accepts integers from 1 to 26', () => {
    expect(validateWindowSize(1)).toBe(1);
    expect(validateWindowSize(4)).toBe(4);
    expect(validateWindowSize(14)).toBe(14);
    expect(validateWindowSize(26)).toBe(26);
  });

  it('rejects zero, negative, non-integer, NaN, and > 26', () => {
    for (const invalid of [0, -1, 1.5, Number.NaN, 27]) {
      expect(() => validateWindowSize(invalid)).toThrow(RangeError);
    }
  });
});

describe('findMarkerPosition', () => {
  it('solves all five Part 1 examples (K=4)', () => {
    for (const [signal, expected] of PART_1_EXAMPLES) {
      expect(findMarkerPosition(new DatastreamBuffer(signal), 4)).toBe(expected);
    }
  });

  it('solves all five Part 2 examples (K=14)', () => {
    for (const [signal, expected] of PART_2_EXAMPLES) {
      expect(findMarkerPosition(new DatastreamBuffer(signal), 14)).toBe(expected);
    }
  });

  it('handles start, end, stale lastSeen before start, K=1, and K=26 boundaries', () => {
    expect(findMarkerPosition(new DatastreamBuffer('abcdxyz'), 4)).toBe(4);
    expect(findMarkerPosition(new DatastreamBuffer('aaaaabcd'), 4)).toBe(8);
    expect(findMarkerPosition(new DatastreamBuffer('abcbdef'), 4)).toBe(6);
    expect(findMarkerPosition(new DatastreamBuffer('z'), 1)).toBe(1);
    expect(findMarkerPosition(new DatastreamBuffer('abcdefghijklmnopqrstuvwxyz'), 26)).toBe(26);
    expect(findMarkerPosition(new DatastreamBuffer('aabcdefghijklmnopqrstuvwxyz'), 26)).toBe(27);
  });

  it('rejects invalid windowSize, too-short stream, and marker-less streams', () => {
    const sample = new DatastreamBuffer('abcdefgh');
    for (const invalid of [0, -1, 1.5, Number.NaN, 27]) {
      expect(() => findMarkerPosition(sample, invalid)).toThrow(RangeError);
    }
    expect(() => findMarkerPosition(new DatastreamBuffer('abc'), 4)).toThrow(RangeError);
    expect(() => findMarkerPosition(new DatastreamBuffer('aaaaaaa'), 4)).toThrow(RangeError);
    expect(() => findMarkerPosition(new DatastreamBuffer('aabbccdd'), 4)).toThrow(RangeError);
  });

  it('matches both differential oracles across 64 seeded PRNG streams for K in {1, 4, 14, 26}', () => {
    const state = { value: 20221206 };
    const windowSizes = [1, 4, 14, 26];
    for (let i = 0; i < 64; i += 1) {
      const k = windowSizes[i % windowSizes.length]!;
      const alphabetSpan = i % 5 === 0 ? Math.max(1, k - 1) : 26;
      const len = k + nextSeededInt(state, 40);
      const signal = generateSignal(state, len, alphabetSpan);
      const buffer = new DatastreamBuffer(signal);
      const setExpected = directSetWindowOracle(signal, k);
      const xorExpected = xorBitmaskWindowOracle(signal, k);
      expect(xorExpected).toBe(setExpected);
      if (setExpected === null) {
        expect(() => findMarkerPosition(buffer, k)).toThrow(RangeError);
      } else {
        expect(findMarkerPosition(buffer, k)).toBe(setExpected);
      }
    }
  });
});
