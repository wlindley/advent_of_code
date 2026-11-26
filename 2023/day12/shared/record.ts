const PATTERN_RE = /^[.#?]+$/;
const DIGITS_RE = /^\d+$/;

/** Validates that `copies` is a positive safe integer unfold factor. */
export function validateUnfoldFactor(copies: number): number {
  if (!Number.isSafeInteger(copies) || copies < 1) {
    throw new RangeError(`Unfold factor must be a positive safe integer, got ${copies}`);
  }
  return copies;
}

function assertValidPattern(pattern: string): void {
  if (pattern.length === 0 || !PATTERN_RE.test(pattern)) {
    throw new RangeError(`Invalid spring pattern "${pattern}"`);
  }
}

function freezeValidatedGroups(groups: readonly number[]): readonly number[] {
  for (const group of groups) {
    if (!Number.isSafeInteger(group) || group < 1) {
      throw new RangeError(`Group size must be a positive safe integer, got ${group}`);
    }
  }
  return Object.freeze([...groups]);
}

/** Immutable spring condition record pairing a `[.#?]+` pattern with contiguous `#`-run sizes. */
export class SpringRecord {
  readonly pattern: string;
  readonly groups: readonly number[];

  constructor(pattern: string, groups: readonly number[]) {
    assertValidPattern(pattern);
    this.pattern = pattern;
    this.groups = freezeValidatedGroups(groups);
    Object.freeze(this);
  }

  get length(): number {
    return this.pattern.length;
  }

  get groupCount(): number {
    return this.groups.length;
  }

  get wildcardCount(): number {
    let count = 0;
    for (let i = 0; i < this.pattern.length; i += 1) {
      if (this.pattern[i] === '?') count += 1;
    }
    return count;
  }

  unfold(copies: number): SpringRecord {
    const factor = validateUnfoldFactor(copies);
    if (factor === 1) return this;
    const patterns: string[] = [];
    const expandedGroups: number[] = [];
    for (let i = 0; i < factor; i += 1) {
      patterns.push(this.pattern);
      expandedGroups.push(...this.groups);
    }
    return new SpringRecord(patterns.join('?'), expandedGroups);
  }
}

function parseGroupsCsv(csv: string, lineNumber: number): readonly number[] {
  const groups: number[] = [];
  for (const token of csv.split(',')) {
    if (!DIGITS_RE.test(token)) {
      throw new RangeError(`Line ${lineNumber}: invalid group token "${token}"`);
    }
    const value = Number(token);
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new RangeError(`Line ${lineNumber}: group must be >= 1 safe integer, got "${token}"`);
    }
    groups.push(value);
  }
  return groups;
}

function parseSpringLine(trimmed: string, lineNumber: number): SpringRecord {
  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 2) {
    throw new SyntaxError(`Line ${lineNumber}: expected "<pattern> <groups>", got "${trimmed}"`);
  }
  return new SpringRecord(tokens[0]!, parseGroupsCsv(tokens[1]!, lineNumber));
}

/** Parses non-empty CRLF/LF spring condition lines into frozen `SpringRecord` instances. */
export function parseSpringRecords(raw: string): readonly SpringRecord[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const records: SpringRecord[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    records.push(parseSpringLine(trimmed, i + 1));
  }
  if (records.length === 0) {
    throw new RangeError('Input must contain at least one spring condition record');
  }
  return Object.freeze(records);
}
