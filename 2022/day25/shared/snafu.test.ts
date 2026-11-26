import { describe, expect, it } from 'vitest';
import {
  decodeSnafu,
  encodeSnafu,
  SNAFU_DIGITS,
  snafuDigitToValue,
  SnafuNumber,
} from './snafu';

const BROCHURE_PAIRS: readonly (readonly [bigint, string])[] = [
  [0n, '0'],
  [1n, '1'],
  [2n, '2'],
  [3n, '1='],
  [4n, '1-'],
  [5n, '10'],
  [6n, '11'],
  [7n, '12'],
  [8n, '2='],
  [9n, '2-'],
  [10n, '20'],
  [15n, '1=0'],
  [20n, '1-0'],
  [2022n, '1=11-2'],
  [12345n, '1-0---0'],
  [314159265n, '1121-1110-1=0'],
];

describe('SNAFU encoding and decoding', () => {
  it('exports frozen SNAFU_DIGITS in ascending value order', () => {
    expect(SNAFU_DIGITS).toEqual(['=', '-', '0', '1', '2']);
    expect(Object.isFrozen(SNAFU_DIGITS)).toBe(true);
  });

  it('maps valid digits and rejects invalid or prototype-key strings', () => {
    expect(snafuDigitToValue('=')).toBe(-2);
    expect(snafuDigitToValue('-')).toBe(-1);
    expect(snafuDigitToValue('0')).toBe(0);
    expect(snafuDigitToValue('1')).toBe(1);
    expect(snafuDigitToValue('2')).toBe(2);

    for (const bad of ['3', 'a', ' ', '', '12', 'toString']) {
      expect(() => snafuDigitToValue(bad)).toThrow(RangeError);
    }
  });

  it('decodes and encodes all brochure examples and negatives', () => {
    for (const [dec, snafu] of BROCHURE_PAIRS) {
      expect(decodeSnafu(snafu)).toBe(dec);
      expect(encodeSnafu(dec)).toBe(snafu);
    }

    const negPairs: readonly (readonly [bigint, string])[] = [
      [-1n, '-'],
      [-2n, '='],
      [-3n, '-2'],
      [-10n, '=0'],
      [-12345n, '-101110'],
    ];
    for (const [dec, snafu] of negPairs) {
      expect(decodeSnafu(snafu)).toBe(dec);
      expect(encodeSnafu(dec)).toBe(snafu);
    }
  });

  it('round-trips arbitrary BigInts beyond MAX_SAFE_INTEGER and rejects bad input', () => {
    const bigPos = 10n ** 28n + 987654321012345n;
    const bigNeg = -bigPos;
    expect(decodeSnafu(encodeSnafu(bigPos))).toBe(bigPos);
    expect(decodeSnafu(encodeSnafu(bigNeg))).toBe(bigNeg);

    expect(() => decodeSnafu('')).toThrow(RangeError);
    expect(() => decodeSnafu('123')).toThrow(RangeError);
    expect(() => decodeSnafu('1=a')).toThrow(RangeError);
  });
});

describe('SnafuNumber', () => {
  it('computes dynamic decimal, canonical, digitCount, and frozen digitTerms', () => {
    const num = new SnafuNumber('2=-01');
    expect(Object.isFrozen(num)).toBe(true);
    expect(num.text).toBe('2=-01');
    expect(num.decimal).toBe(976n);
    expect(num.canonical).toBe('2=-01');
    expect(num.digitCount).toBe(5);

    const terms = num.digitTerms;
    expect(Object.isFrozen(terms)).toBe(true);
    expect(terms.map((t) => [t.placeIndex, t.placeValue, t.digit, t.digitValue, t.contribution])).toEqual([
      [4, 625n, '2', 2, 1250n],
      [3, 125n, '=', -2, -250n],
      [2, 25n, '-', -1, -25n],
      [1, 5n, '0', 0, 0n],
      [0, 1n, '1', 1, 1n],
    ]);
    expect(Object.isFrozen(terms[0])).toBe(true);
    expect(terms.reduce((acc, t) => acc + t.contribution, 0n)).toBe(num.decimal);
  });

  it('distinguishes leading-zero text from canonical form and rejects invalid text', () => {
    const padded = new SnafuNumber('001');
    expect(padded.decimal).toBe(1n);
    expect(padded.canonical).toBe('1');
    expect(padded.digitCount).toBe(3);

    expect(() => new SnafuNumber('')).toThrow(RangeError);
    expect(() => new SnafuNumber('19')).toThrow(RangeError);
  });
});
