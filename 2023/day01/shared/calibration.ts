/** Validates that `value` is an integer `>= min`. */
function assertIntAtLeast(value: number, min: number, label: string): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${label} must be an integer >= ${min}, got ${value}`);
  }
}

/** Frozen value object describing a matched calibration digit span in a line. */
export class DigitMatch {
  readonly value: number;
  readonly start: number;
  readonly length: number;

  constructor(value: number, start: number, length: number) {
    if (!Number.isInteger(value) || value < 0 || value > 9) {
      throw new RangeError(`Digit value must be an integer in [0, 9], got ${value}`);
    }
    assertIntAtLeast(start, 0, 'start');
    assertIntAtLeast(length, 1, 'length');
    this.value = value;
    this.start = start;
    this.length = length;
    Object.freeze(this);
  }

  get end(): number {
    return this.start + this.length;
  }
}

/** Frozen calibration result for a single input line. */
export class LineCalibration {
  readonly lineNumber: number;
  readonly text: string;
  readonly first: DigitMatch;
  readonly last: DigitMatch;

  constructor(lineNumber: number, text: string, first: DigitMatch, last: DigitMatch) {
    assertIntAtLeast(lineNumber, 1, 'lineNumber');
    if (text.length === 0) {
      throw new Error('Line text must be non-empty');
    }
    if (first.end > text.length || last.end > text.length) {
      throw new RangeError('Digit match span must fall within line bounds');
    }
    if (first.start > last.start) {
      throw new RangeError('First digit match must not start after last digit match');
    }
    this.lineNumber = lineNumber;
    this.text = text;
    this.first = first;
    this.last = last;
    Object.freeze(this);
  }

  get value(): number {
    return this.first.value * 10 + this.last.value;
  }

  get isSingleDigit(): boolean {
    return this.first.start === this.last.start && this.first.length === this.last.length;
  }
}

/** Strategy interface for matching a calibration digit at a given string index. */
export interface DigitExtractor {
  matchAt(line: string, index: number): DigitMatch | null;
}

function findFirstDigit(line: string, extractor: DigitExtractor): DigitMatch | null {
  for (let i = 0; i < line.length; i += 1) {
    const match = extractor.matchAt(line, i);
    if (match) return match;
  }
  return null;
}

function findLastDigit(line: string, first: DigitMatch, extractor: DigitExtractor): DigitMatch {
  // Scan strictly after first.start; fall back to `first` when only one digit position exists.
  for (let i = line.length - 1; i > first.start; i -= 1) {
    const match = extractor.matchAt(line, i);
    if (match) return match;
  }
  return first;
}

/** Extracts the first and last calibration digits for `line` using `extractor`. */
export function calibrateLine(
  line: string,
  lineNumber: number,
  extractor: DigitExtractor,
): LineCalibration {
  assertIntAtLeast(lineNumber, 1, 'lineNumber');
  const first = findFirstDigit(line, extractor);
  if (!first) {
    throw new Error(`Line ${lineNumber}: no calibration digit found in "${line}"`);
  }
  return new LineCalibration(lineNumber, line, first, findLastDigit(line, first, extractor));
}
