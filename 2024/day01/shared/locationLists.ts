const LINE_PAIR_PATTERN = /^\s*(-?\d+)\s+(-?\d+)\s*$/;

function assertSafeIntegers(values: readonly number[], column: string): readonly number[] {
  const normalized: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i]!;
    if (!Number.isSafeInteger(value)) {
      throw new RangeError(`${column}[${i}] must be a safe integer, got ${value}`);
    }
    normalized.push(value + 0);
  }
  return Object.freeze(normalized);
}

function parseSafeIntToken(token: string, lineNumber: number, column: string): number {
  const value = Number(token);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Line ${lineNumber}: ${column} location ID must be a safe integer, got "${token}"`);
  }
  return value + 0;
}

function parseLinePair(line: string, lineNumber: number): readonly [number, number] {
  const match = LINE_PAIR_PATTERN.exec(line);
  if (!match) {
    throw new Error(`Line ${lineNumber}: invalid location pair "${line}"`);
  }
  return [
    parseSafeIntToken(match[1]!, lineNumber, 'left'),
    parseSafeIntToken(match[2]!, lineNumber, 'right'),
  ];
}

/** Immutable, equal-length pair of safe-integer location ID columns. */
export class LocationLists {
  readonly left: readonly number[];
  readonly right: readonly number[];

  constructor(left: readonly number[], right: readonly number[]) {
    if (left.length !== right.length) {
      throw new RangeError(`Location lists must have equal length, got ${left.length} and ${right.length}`);
    }
    this.left = assertSafeIntegers(left, 'left');
    this.right = assertSafeIntegers(right, 'right');
    Object.freeze(this);
  }

  get size(): number {
    return this.left.length;
  }

  get isEmpty(): boolean {
    return this.left.length === 0;
  }
}

/** Parses whitespace-separated integer column pairs into an immutable `LocationLists`. */
export function parseLocationLists(raw: string): LocationLists {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Input must contain at least one location pair');
  }
  const lines = trimmed.split(/\r?\n/);
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const [leftValue, rightValue] = parseLinePair(lines[i]!, i + 1);
    left.push(leftValue);
    right.push(rightValue);
  }
  return new LocationLists(left, right);
}
