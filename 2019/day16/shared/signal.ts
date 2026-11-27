/** Repeating base multiplier pattern for Flawed Frequency Transmission. */
export const BASE_PATTERN = Object.freeze([0, 1, 0, -1] as const);

/** Default FFT phase count specified by both parts of the puzzle. */
export const DEFAULT_PHASES = 100;

/** Output message width in digits. */
export const MESSAGE_LENGTH = 8;

/** Leading prefix width encoding the Part 2 message offset. */
export const OFFSET_DIGITS = 7;

/** Part 2 signal repetition multiplier. */
export const PART2_REPEAT_COUNT = 10_000;

export type PatternWeight = -1 | 0 | 1;

/** Validates that `value` is a non-negative integer. */
export function assertNonNegativeInt(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer, got ${value}`);
  }
  return value;
}

/** Validates that `value` is a positive integer (>= 1). */
export function assertPositiveInt(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive integer, got ${value}`);
  }
  return value;
}

/** Returns the FFT multiplier weight for 0-based `outputIndex` and `inputIndex`. */
export function patternWeight(outputIndex: number, inputIndex: number): PatternWeight {
  assertNonNegativeInt(outputIndex, 'outputIndex');
  assertNonNegativeInt(inputIndex, 'inputIndex');
  const patternIndex = Math.floor((inputIndex + 1) / (outputIndex + 1)) % 4;
  return BASE_PATTERN[patternIndex]!;
}

function assertSliceBounds(start: number, count: number, length: number): void {
  assertNonNegativeInt(start, 'start');
  assertNonNegativeInt(count, 'count');
  if (start + count > length) {
    throw new RangeError(`Slice [${start}, ${start + count}) exceeds signal length ${length}`);
  }
}

/** Immutable decimal digit signal backed by a private Uint8Array buffer. */
export class Signal {
  readonly #digits: Uint8Array;

  private constructor(digits: Uint8Array) {
    this.#digits = digits;
    Object.freeze(this);
  }

  /** Parses a decimal digit string into an immutable Signal. */
  static parse(raw: string): Signal {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new Error('Signal input must not be empty');
    }
    const digits = new Uint8Array(trimmed.length);
    for (let i = 0; i < trimmed.length; i += 1) {
      const digit = trimmed.charCodeAt(i) - 48;
      if (digit < 0 || digit > 9) {
        throw new Error(`Invalid signal digit at index ${i}`);
      }
      digits[i] = digit;
    }
    return new Signal(digits);
  }

  /** Creates a Signal by defensively copying an array-like sequence of digits `0..9`. */
  static fromDigits(digits: ArrayLike<number>): Signal {
    if (digits.length === 0) {
      throw new Error('Signal must contain at least one digit');
    }
    const copy = new Uint8Array(digits.length);
    for (let i = 0; i < digits.length; i += 1) {
      const value = digits[i]!;
      if (!Number.isInteger(value) || value < 0 || value > 9) {
        throw new RangeError(`Signal digit at index ${i} must be in 0..9, got ${value}`);
      }
      copy[i] = value;
    }
    return new Signal(copy);
  }

  get length(): number {
    return this.#digits.length;
  }

  at(index: number): number {
    assertNonNegativeInt(index, 'index');
    if (index >= this.#digits.length) {
      throw new RangeError(`Index ${index} exceeds signal length ${this.#digits.length}`);
    }
    return this.#digits[index]!;
  }

  sliceString(start: number, count: number): string {
    assertSliceBounds(start, count, this.#digits.length);
    let out = '';
    for (let i = start; i < start + count; i += 1) {
      out += String(this.#digits[i]!);
    }
    return out;
  }

  sliceDigits(start: number, count: number): Uint8Array {
    assertSliceBounds(start, count, this.#digits.length);
    return this.#digits.slice(start, start + count);
  }

  readOffset(digitCount: number): number {
    assertPositiveInt(digitCount, 'digitCount');
    if (digitCount > this.#digits.length) {
      throw new RangeError(`Offset width ${digitCount} exceeds signal length ${this.#digits.length}`);
    }
    let offset = 0;
    for (let i = 0; i < digitCount; i += 1) {
      offset = offset * 10 + this.#digits[i]!;
    }
    return offset;
  }

  copyToBuffer(): Uint8Array {
    return new Uint8Array(this.#digits);
  }

  toString(): string {
    return this.sliceString(0, this.#digits.length);
  }
}

/** Parses raw puzzle input text into a Signal instance. */
export function parseSignal(raw: string): Signal {
  return Signal.parse(raw);
}
