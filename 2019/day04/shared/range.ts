import { assertSixDigitPassword } from './candidate';

const RANGE_PATTERN = /^(\d{6})-(\d{6})$/;

/** Immutable inclusive 6-digit password search range. */
export class PasswordRange {
  readonly low: number;
  readonly high: number;

  constructor(low: number, high: number) {
    assertSixDigitPassword(low);
    assertSixDigitPassword(high);
    if (low > high) {
      throw new RangeError(`Password range low (${low}) cannot exceed high (${high})`);
    }
    this.low = low;
    this.high = high;
    Object.freeze(this);
  }

  get span(): number {
    return this.high - this.low + 1;
  }

  contains(value: number): boolean {
    return Number.isInteger(value) && value >= this.low && value <= this.high;
  }
}

/** Parses a `"LOW-HIGH"` 6-digit password range string into a `PasswordRange`. */
export function parsePasswordRange(raw: string): PasswordRange {
  const match = RANGE_PATTERN.exec(raw.trim());
  if (match === null) {
    throw new SyntaxError('Expected a 6-digit password range in "LOW-HIGH" format');
  }
  return new PasswordRange(Number(match[1]!), Number(match[2]!));
}
