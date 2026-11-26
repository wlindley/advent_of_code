import { assertSafeInt, classifyStepViolation, StepFailure, type TrendDirection } from './step';

const STRICT_INT_TOKEN = /^-?\d+$/;

function normalizeLevels(levels: readonly number[]): readonly number[] {
  const copy: number[] = [];
  for (let i = 0; i < levels.length; i += 1) {
    copy.push(assertSafeInt(levels[i]!, `levels[${i}]`));
  }
  return Object.freeze(copy);
}

function parseLevelToken(token: string, lineNumber: number): number {
  if (!STRICT_INT_TOKEN.test(token)) {
    throw new Error(`Line ${lineNumber}: invalid level "${token}"`);
  }
  const value = Number(token);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Line ${lineNumber}: level must be a safe integer, got "${token}"`);
  }
  return value + 0;
}

function parseReportLine(line: string, lineNumber: number): Report {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new Error(`Line ${lineNumber}: blank report line`);
  }
  const tokens = trimmed.split(/\s+/);
  const levels: number[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    levels.push(parseLevelToken(tokens[i]!, lineNumber));
  }
  return new Report(levels);
}

/** Immutable sequence of reactor integer levels with derived safety invariants. */
export class Report {
  readonly levels: readonly number[];

  constructor(levels: readonly number[]) {
    this.levels = normalizeLevels(levels);
    Object.freeze(this);
  }

  get length(): number {
    return this.levels.length;
  }

  get trend(): TrendDirection | null {
    if (this.levels.length < 2) return null;
    const diff = this.levels[1]! - this.levels[0]!;
    if (diff === 0) return null;
    return diff > 0 ? 1 : -1;
  }

  /** Returns the first step violation scanning from index 0, or `null` if safe. */
  firstFailure(): StepFailure | null {
    if (this.levels.length < 2) return null;
    const expected = this.trend;
    if (expected === null) {
      return new StepFailure(0, this.levels[0]!, this.levels[1]!, 'flat');
    }
    for (let i = 0; i < this.levels.length - 1; i += 1) {
      const prev = this.levels[i]!;
      const next = this.levels[i + 1]!;
      const reason = classifyStepViolation(prev, next, expected);
      if (reason !== null) return new StepFailure(i, prev, next, reason);
    }
    return null;
  }

  get isSafe(): boolean {
    return this.firstFailure() === null;
  }
}

/** Parses newline-delimited whitespace-separated integer reports (`LF` or `CRLF`). */
export function parseReports(raw: string): readonly Report[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Input must contain at least one report');
  }
  const lines = trimmed.split(/\r?\n/);
  const reports: Report[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    reports.push(parseReportLine(lines[i]!, i + 1));
  }
  return Object.freeze(reports);
}
