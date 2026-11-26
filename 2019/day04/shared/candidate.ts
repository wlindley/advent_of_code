export const MIN_PASSWORD = 100_000;
export const MAX_PASSWORD = 999_999;
export const PASSWORD_LENGTH = 6;

export type PasswordDigits = readonly [number, number, number, number, number, number];

export interface DigitRun {
  readonly digit: number;
  readonly startIndex: number;
  readonly length: number;
}

/** Immutable analysis of a 6-digit password candidate and its contiguous digit runs. */
export class PasswordAnalysis {
  readonly value: number;
  readonly digits: PasswordDigits;
  readonly runs: readonly DigitRun[];

  constructor(value: number, digits: PasswordDigits, runs: readonly DigitRun[]) {
    this.value = value;
    this.digits = digits;
    this.runs = runs;
    Object.freeze(this);
  }

  get isNonDecreasing(): boolean {
    for (let i = 1; i < PASSWORD_LENGTH; i += 1) {
      if (this.digits[i]! < this.digits[i - 1]!) return false;
    }
    return true;
  }

  get maxRunLength(): number {
    let max = 0;
    for (const run of this.runs) {
      if (run.length > max) max = run.length;
    }
    return max;
  }
}

/** Ensures a candidate value is a 6-digit integer within [100000, 999999]. */
export function assertSixDigitPassword(value: number): void {
  if (!Number.isInteger(value) || value < MIN_PASSWORD || value > MAX_PASSWORD) {
    throw new RangeError(
      `Password must be an integer in [${MIN_PASSWORD}, ${MAX_PASSWORD}], got ${value}`,
    );
  }
}

/** Extracts the 6 decimal digits of a valid password into a frozen tuple. */
export function extractDigits(value: number): PasswordDigits {
  assertSixDigitPassword(value);
  let remaining = value;
  const d5 = remaining % 10;
  remaining = Math.trunc(remaining / 10);
  const d4 = remaining % 10;
  remaining = Math.trunc(remaining / 10);
  const d3 = remaining % 10;
  remaining = Math.trunc(remaining / 10);
  const d2 = remaining % 10;
  remaining = Math.trunc(remaining / 10);
  const d1 = remaining % 10;
  const d0 = Math.trunc(remaining / 10);
  return Object.freeze([d0, d1, d2, d3, d4, d5] as const);
}

/** Returns the smallest non-decreasing 6-digit integer >= `value`. */
export function ceilNonDecreasing(value: number): number {
  const digits = extractDigits(value);
  let floorDigit = 0;
  let clamped = false;
  let result = 0;
  for (const digit of digits) {
    if (clamped || digit < floorDigit) {
      clamped = true;
      result = result * 10 + floorDigit;
    } else {
      floorDigit = digit;
      result = result * 10 + digit;
    }
  }
  return result;
}

/** Returns the smallest non-decreasing 6-digit integer strictly > `value`, or `null` at max. */
export function nextNonDecreasing(value: number): number | null {
  assertSixDigitPassword(value);
  if (value === MAX_PASSWORD) return null;
  return ceilNonDecreasing(value + 1);
}

function buildDigitRuns(digits: PasswordDigits): readonly DigitRun[] {
  const runs: DigitRun[] = [];
  let startIndex = 0;
  let current = digits[0];
  for (let i = 1; i < PASSWORD_LENGTH; i += 1) {
    const digit = digits[i]!;
    if (digit !== current) {
      runs.push(Object.freeze({ digit: current, startIndex, length: i - startIndex }));
      current = digit;
      startIndex = i;
    }
  }
  runs.push(Object.freeze({ digit: current, startIndex, length: PASSWORD_LENGTH - startIndex }));
  return Object.freeze(runs);
}

/** Extracts digits and contiguous runs for a 6-digit password candidate. */
export function analyzePassword(value: number): PasswordAnalysis {
  const digits = extractDigits(value);
  return new PasswordAnalysis(value, digits, buildDigitRuns(digits));
}
