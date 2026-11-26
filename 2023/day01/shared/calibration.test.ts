import { describe, expect, it } from 'vitest';
import {
  calibrateLine,
  DigitMatch,
  LineCalibration,
  type DigitExtractor,
} from './calibration';

const simpleExtractor: DigitExtractor = {
  matchAt(line: string, index: number): DigitMatch | null {
    const ch = line[index];
    if (ch !== undefined && ch >= '0' && ch <= '9') {
      return new DigitMatch(Number(ch), index, 1);
    }
    if (line.startsWith('two', index)) {
      return new DigitMatch(2, index, 3);
    }
    return null;
  },
};

describe('DigitMatch', () => {
  it('constructs a frozen value object and computes end', () => {
    const zero = new DigitMatch(0, 0, 1);
    const word = new DigitMatch(9, 2, 4);
    expect(Object.isFrozen(zero)).toBe(true);
    expect(zero.value).toBe(0);
    expect(zero.start).toBe(0);
    expect(zero.length).toBe(1);
    expect(zero.end).toBe(1);
    expect(word.value).toBe(9);
    expect(word.end).toBe(6);
  });

  it('rejects out-of-range or non-integer fields', () => {
    expect(() => new DigitMatch(-1, 0, 1)).toThrow(RangeError);
    expect(() => new DigitMatch(10, 0, 1)).toThrow(RangeError);
    expect(() => new DigitMatch(1.5, 0, 1)).toThrow(RangeError);
    expect(() => new DigitMatch(1, -1, 1)).toThrow(RangeError);
    expect(() => new DigitMatch(1, 0.5, 1)).toThrow(RangeError);
    expect(() => new DigitMatch(1, 0, 0)).toThrow(RangeError);
    expect(() => new DigitMatch(1, 0, 1.5)).toThrow(RangeError);
  });
});

describe('LineCalibration', () => {
  it('constructs a frozen calibration and derives value and isSingleDigit', () => {
    const first = new DigitMatch(1, 0, 1);
    const last = new DigitMatch(4, 3, 1);
    const multi = new LineCalibration(1, '1ab4', first, last);
    expect(Object.isFrozen(multi)).toBe(true);
    expect(multi.value).toBe(14);
    expect(multi.isSingleDigit).toBe(false);

    const sameStartDiffLen = new LineCalibration(2, 'two', new DigitMatch(2, 0, 1), new DigitMatch(2, 0, 3));
    expect(sameStartDiffLen.isSingleDigit).toBe(false);

    const single = new LineCalibration(3, 'a7b', new DigitMatch(7, 1, 1), new DigitMatch(7, 1, 1));
    expect(single.value).toBe(77);
    expect(single.isSingleDigit).toBe(true);
  });

  it('rejects invalid line numbers, empty text, out-of-bounds, and inverted matches', () => {
    const m = new DigitMatch(5, 0, 1);
    expect(() => new LineCalibration(0, '5', m, m)).toThrow(RangeError);
    expect(() => new LineCalibration(1.5, '5', m, m)).toThrow(RangeError);
    expect(() => new LineCalibration(1, '', m, m)).toThrow(Error);
    expect(() => new LineCalibration(1, '5', new DigitMatch(5, 0, 2), m)).toThrow(RangeError);
    expect(() => new LineCalibration(1, '5', m, new DigitMatch(5, 1, 1))).toThrow(RangeError);
    expect(() => new LineCalibration(1, '56', new DigitMatch(6, 1, 1), new DigitMatch(5, 0, 1))).toThrow(RangeError);
  });
});

describe('calibrateLine', () => {
  it('finds first and last digits across multi-digit, single-digit, end-digit, and multi-char cases', () => {
    const multi = calibrateLine('a1b2c', 1, simpleExtractor);
    expect(multi.value).toBe(12);
    expect(multi.isSingleDigit).toBe(false);

    const single = calibrateLine('treb7uchet', 2, simpleExtractor);
    expect(single.value).toBe(77);
    expect(single.isSingleDigit).toBe(true);

    const atEnd = calibrateLine('ab9', 3, simpleExtractor);
    expect(atEnd.value).toBe(99);
    expect(atEnd.isSingleDigit).toBe(true);

    const word = calibrateLine('xtwoy', 4, simpleExtractor);
    expect(word.value).toBe(22);
    expect(word.first.end).toBe(4);
  });

  it('throws with 1-based line number when no digit exists and rejects invalid lineNumber', () => {
    expect(() => calibrateLine('nodigits', 4, simpleExtractor)).toThrow(
      'Line 4: no calibration digit found in "nodigits"',
    );
    expect(() => calibrateLine('', 2, simpleExtractor)).toThrow(
      'Line 2: no calibration digit found in ""',
    );
    expect(() => calibrateLine('nodigits', 0, simpleExtractor)).toThrow(RangeError);
  });
});
