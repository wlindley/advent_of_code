import {
  classifySyntaxLine,
  CompleteLineResult,
  CorruptedLineResult,
  IncompleteLineResult,
  type SyntaxLineResult,
} from './line';

/** Three-way ascending comparator for arbitrary-precision `bigint` values. */
export function compareBigIntAsc(a: bigint, b: bigint): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Immutable subsystem-wide syntax analysis built over classified lines with zero stored derived state. */
export class SyntaxAnalysis {
  readonly results: readonly SyntaxLineResult[];

  constructor(results: readonly SyntaxLineResult[]) {
    if (results.length === 0) {
      throw new RangeError('SyntaxAnalysis requires at least one classified line');
    }
    this.results = Object.freeze([...results]);
    Object.freeze(this);
  }

  get corruptedLines(): readonly CorruptedLineResult[] {
    return Object.freeze(this.results.filter((r): r is CorruptedLineResult => r.status === 'corrupted'));
  }

  get incompleteLines(): readonly IncompleteLineResult[] {
    return Object.freeze(this.results.filter((r): r is IncompleteLineResult => r.status === 'incomplete'));
  }

  get completeLines(): readonly CompleteLineResult[] {
    return Object.freeze(this.results.filter((r): r is CompleteLineResult => r.status === 'complete'));
  }

  get totalCorruptionScore(): bigint {
    let total = 0n;
    for (const line of this.corruptedLines) total += line.corruptionScore;
    return total;
  }

  get sortedIncompleteLines(): readonly IncompleteLineResult[] {
    return Object.freeze(
      [...this.incompleteLines].sort((a, b) => compareBigIntAsc(a.autocompleteScore, b.autocompleteScore)),
    );
  }

  get medianIncompleteLine(): IncompleteLineResult {
    const sorted = this.sortedIncompleteLines;
    if (sorted.length === 0) {
      throw new RangeError('Cannot compute autocomplete median with zero incomplete lines');
    }
    return sorted[Math.floor(sorted.length / 2)]!;
  }

  get medianAutocompleteScore(): bigint {
    return this.medianIncompleteLine.autocompleteScore;
  }
}

/** Classifies every line in `lines` and wraps the results in a frozen `SyntaxAnalysis`. */
export function analyzeSyntax(lines: readonly string[]): SyntaxAnalysis {
  return new SyntaxAnalysis(lines.map((line, index) => classifySyntaxLine(index, line)));
}
