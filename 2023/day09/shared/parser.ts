import { DifferencePyramid } from './pyramid';
import type { ExtrapolationStrategy } from './strategy';

/** Matches canonical base-10 signed integers accepted by OASIS report lines. */
export const SIGNED_INT_PATTERN = /^-?\d+$/;

/**
 * Immutable parsed OASIS environmental report containing one or more
 * non-empty integer histories.
 */
export class OasisReport {
  readonly histories: readonly (readonly bigint[])[];

  constructor(histories: readonly (readonly bigint[])[]) {
    if (histories.length === 0) {
      throw new Error('OASIS report must contain at least one history');
    }
    const frozenHistories = histories.map((history, index) => {
      if (history.length === 0) {
        throw new Error(`History at index ${index} must be non-empty`);
      }
      return Object.freeze([...history]);
    });
    this.histories = Object.freeze(frozenHistories);
    Object.freeze(this);
  }

  /** Total number of histories in the report. */
  get historyCount(): number {
    return this.histories.length;
  }

  /** Extrapolates every history under `strategy` and returns their exact sum. */
  extrapolateSum(strategy: ExtrapolationStrategy): bigint {
    let total = 0n;
    for (const history of this.histories) {
      total += DifferencePyramid.fromHistory(history).extrapolate(strategy).value;
    }
    return total;
  }
}

/** Parses one whitespace-delimited history line into a frozen `bigint` tuple. */
export function parseHistoryLine(line: string, lineNumber: number): readonly bigint[] {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new Error(`OASIS history on line ${lineNumber} must not be empty`);
  }
  const tokens = trimmed.split(/\s+/);
  const values = tokens.map((token) => {
    if (!SIGNED_INT_PATTERN.test(token)) {
      throw new Error(`Invalid integer on line ${lineNumber}: "${token}"`);
    }
    return BigInt(token);
  });
  return Object.freeze(values);
}

/** Parses a multi-line OASIS report, skipping blank lines while preserving line numbers. */
export function parseOasisReport(raw: string): OasisReport {
  const lines = raw.split(/\r?\n/);
  const histories: (readonly bigint[])[] = [];
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx]!;
    if (line.trim().length === 0) continue;
    histories.push(parseHistoryLine(line, idx + 1));
  }
  if (histories.length === 0) {
    throw new Error('OASIS report must contain at least one history');
  }
  return new OasisReport(histories);
}
