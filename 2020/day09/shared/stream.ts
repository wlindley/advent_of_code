const OUTER_BLANK_LINES_PATTERN = /^(?:[ \t]*\r?\n)+|(?:\r?\n[ \t]*)+$/g;
const INTEGER_LINE_PATTERN = /^-?\d+$/;

/** Immutable validated XMAS transmission stream of strictly positive BigInt values. */
export class XmasStream {
  readonly values: readonly bigint[];

  constructor(values: readonly bigint[]) {
    if (values.length === 0) {
      throw new RangeError('XMAS stream must contain at least one value');
    }
    for (let i = 0; i < values.length; i += 1) {
      const value = values[i]!;
      if (value <= 0n) {
        throw new RangeError(`XMAS stream values must be positive integers, got ${value} at index ${i}`);
      }
    }
    this.values = Object.freeze([...values]);
    Object.freeze(this);
  }

  get length(): number {
    return this.values.length;
  }

  at(index: number): bigint {
    if (!Number.isInteger(index) || index < 0 || index >= this.values.length) {
      throw new RangeError(`Stream index out of bounds: ${index}`);
    }
    return this.values[index]!;
  }
}

function parseLineBigInt(rawLine: string, lineIndex: number): bigint {
  const clean = rawLine.trim();
  if (!INTEGER_LINE_PATTERN.test(clean)) {
    throw new Error(`Invalid XMAS integer at line ${lineIndex + 1}: "${rawLine}"`);
  }
  return BigInt(clean);
}

/** Parses newline-delimited positive integers, trimming outer blank lines and rejecting internal blanks. */
export function parseXmasStream(raw: string): XmasStream {
  const trimmed = raw.replace(OUTER_BLANK_LINES_PATTERN, '');
  if (trimmed.trim() === '') {
    throw new Error('XMAS stream input cannot be empty');
  }
  const values = trimmed.split(/\r?\n/).map(parseLineBigInt);
  return new XmasStream(values);
}
