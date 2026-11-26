import { floorDiv } from '../../../shared/core';

export type SnafuDigit = '=' | '-' | '0' | '1' | '2';
export type SnafuDigitValue = -2 | -1 | 0 | 1 | 2;

export const SNAFU_DIGITS = Object.freeze(['=', '-', '0', '1', '2'] as const);

export interface SnafuDigitTerm {
  readonly placeIndex: number;
  readonly placeValue: bigint;
  readonly digit: SnafuDigit;
  readonly digitValue: SnafuDigitValue;
  readonly contribution: bigint;
}

const DIGIT_VALUES: ReadonlyMap<string, SnafuDigitValue> = new Map([
  ['=', -2],
  ['-', -1],
  ['0', 0],
  ['1', 1],
  ['2', 2],
]);

/** Maps a single SNAFU digit character to its signed base-5 integer value. */
export function snafuDigitToValue(ch: string): SnafuDigitValue {
  const value = DIGIT_VALUES.get(ch);
  if (value === undefined) {
    throw new RangeError(`Invalid SNAFU digit: "${ch}"`);
  }
  return value;
}

/** Decodes a non-empty SNAFU string into an exact signed `bigint` via Horner's method. */
export function decodeSnafu(text: string): bigint {
  if (text.length === 0) {
    throw new RangeError('SNAFU string cannot be empty');
  }
  let acc = 0n;
  for (let i = 0; i < text.length; i += 1) {
    acc = acc * 5n + BigInt(snafuDigitToValue(text[i]!));
  }
  return acc;
}

/** Encodes any signed `bigint` (negative, zero, or positive) into canonical SNAFU form. */
export function encodeSnafu(value: bigint): string {
  let remaining = value;
  let out = '';
  do {
    const q = floorDiv(remaining + 2n, 5n);
    const idx = Number(remaining + 2n - 5n * q);
    out = SNAFU_DIGITS[idx]! + out;
    remaining = q;
  } while (remaining !== 0n);
  return out;
}

/** Immutable SNAFU number storing only the raw validated string and deriving all properties. */
export class SnafuNumber {
  readonly text: string;

  constructor(text: string) {
    decodeSnafu(text);
    this.text = text;
    Object.freeze(this);
  }

  get decimal(): bigint {
    return decodeSnafu(this.text);
  }

  get canonical(): string {
    return encodeSnafu(this.decimal);
  }

  get digitCount(): number {
    return this.text.length;
  }

  /** Returns place-value terms in MSB-to-LSB display order. */
  get digitTerms(): readonly SnafuDigitTerm[] {
    const len = this.text.length;
    const terms: SnafuDigitTerm[] = [];
    for (let i = 0; i < len; i += 1) {
      const placeIndex = len - 1 - i;
      const placeValue = 5n ** BigInt(placeIndex);
      const digit = this.text[i]! as SnafuDigit;
      const digitValue = snafuDigitToValue(digit);
      terms.push(
        Object.freeze({
          placeIndex,
          placeValue,
          digit,
          digitValue,
          contribution: placeValue * BigInt(digitValue),
        }),
      );
    }
    return Object.freeze(terms);
  }
}
