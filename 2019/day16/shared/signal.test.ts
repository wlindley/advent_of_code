import { describe, expect, it } from 'vitest';
import {
  assertNonNegativeInt,
  assertPositiveInt,
  BASE_PATTERN,
  DEFAULT_PHASES,
  MESSAGE_LENGTH,
  OFFSET_DIGITS,
  PART2_REPEAT_COUNT,
  parseSignal,
  patternWeight,
  Signal,
} from './signal';

describe('signal constants and validators', () => {
  it('exposes frozen AoC Day 16 constants', () => {
    expect(BASE_PATTERN).toEqual([0, 1, 0, -1]);
    expect(Object.isFrozen(BASE_PATTERN)).toBe(true);
    expect(DEFAULT_PHASES).toBe(100);
    expect(MESSAGE_LENGTH).toBe(8);
    expect(OFFSET_DIGITS).toBe(7);
    expect(PART2_REPEAT_COUNT).toBe(10_000);
  });

  it('validates non-negative and positive integers', () => {
    expect(assertNonNegativeInt(0, 'x')).toBe(0);
    expect(assertNonNegativeInt(7, 'x')).toBe(7);
    expect(() => assertNonNegativeInt(-1, 'x')).toThrow(RangeError);
    expect(() => assertNonNegativeInt(1.5, 'x')).toThrow(RangeError);

    expect(assertPositiveInt(1, 'y')).toBe(1);
    expect(() => assertPositiveInt(0, 'y')).toThrow(RangeError);
    expect(() => assertPositiveInt(-3, 'y')).toThrow(RangeError);
    expect(() => assertPositiveInt(2.2, 'y')).toThrow(RangeError);
  });

  it('computes repeating base pattern weights with 1-step left shift', () => {
    const row0 = Array.from({ length: 8 }, (_, col) => patternWeight(0, col));
    const row1 = Array.from({ length: 8 }, (_, col) => patternWeight(1, col));
    const row2 = Array.from({ length: 8 }, (_, col) => patternWeight(2, col));
    expect(row0).toEqual([1, 0, -1, 0, 1, 0, -1, 0]);
    expect(row1).toEqual([0, 1, 1, 0, 0, -1, -1, 0]);
    expect(row2).toEqual([0, 0, 1, 1, 1, 0, 0, 0]);
    expect(() => patternWeight(-1, 0)).toThrow(RangeError);
    expect(() => patternWeight(0, -1)).toThrow(RangeError);
  });
});

describe('Signal', () => {
  it('parses trimmed digit strings and exposes immutable views', () => {
    const signal = parseSignal('  03036732\n');
    expect(Object.isFrozen(signal)).toBe(true);
    expect(signal.length).toBe(8);
    expect(signal.at(0)).toBe(0);
    expect(signal.at(7)).toBe(2);
    expect(signal.sliceString(2, 4)).toBe('0367');
    expect(Array.from(signal.sliceDigits(1, 3))).toEqual([3, 0, 3]);
    expect(signal.readOffset(4)).toBe(303);
    expect(signal.toString()).toBe('03036732');

    const copy = signal.copyToBuffer();
    copy[0] = 9;
    expect(signal.at(0)).toBe(0);
  });

  it('constructs defensively via fromDigits without aliasing input arrays', () => {
    const raw = [1, 2, 3, 4];
    const signal = Signal.fromDigits(raw);
    raw[0] = 9;
    expect(signal.toString()).toBe('1234');
  });

  it('rejects invalid inputs, out-of-range digits, and invalid bounds', () => {
    expect(() => Signal.parse('')).toThrow();
    expect(() => Signal.parse('   \n')).toThrow();
    expect(() => Signal.parse('12a4')).toThrow();
    expect(() => Signal.parse('12/4')).toThrow();
    expect(() => Signal.fromDigits([])).toThrow();
    expect(() => Signal.fromDigits([10])).toThrow(RangeError);
    expect(() => Signal.fromDigits([-1])).toThrow(RangeError);
    expect(() => Signal.fromDigits([1.5])).toThrow(RangeError);

    const signal = Signal.parse('1234');
    expect(() => signal.at(-1)).toThrow(RangeError);
    expect(() => signal.at(4)).toThrow(RangeError);
    expect(() => signal.sliceString(2, 3)).toThrow(RangeError);
    expect(() => signal.sliceDigits(1, 4)).toThrow(RangeError);
    expect(() => signal.readOffset(0)).toThrow(RangeError);
    expect(() => signal.readOffset(5)).toThrow(RangeError);
  });
});
