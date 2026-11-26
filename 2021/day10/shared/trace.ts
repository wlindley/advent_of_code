import { compareBigIntAsc, type SyntaxAnalysis } from './analysis';
import type { CloseBracket } from './brackets';
import type { IncompleteLineResult, SyntaxLineResult } from './line';

export const DEFAULT_MAX_TRACE_STEPS = 120;

function validateInspectedCount(count: number, maxCount: number, label: string): number {
  if (!Number.isInteger(count) || count < 1 || count > maxCount) {
    throw new RangeError(`${label} inspectedCount must be an integer in [1, ${maxCount}], got ${count}`);
  }
  return count;
}

/** Trace frame capturing progressive line-by-line corruption scanning (Part 1). */
export class CorruptionScanFrame {
  readonly kind = 'corruption-score' as const;
  readonly analysis: SyntaxAnalysis;
  readonly inspectedCount: number;

  constructor(analysis: SyntaxAnalysis, inspectedCount: number) {
    this.analysis = analysis;
    this.inspectedCount = validateInspectedCount(inspectedCount, analysis.results.length, 'CorruptionScanFrame');
    Object.freeze(this);
  }

  get currentLine(): SyntaxLineResult {
    return this.analysis.results[this.inspectedCount - 1]!;
  }

  get runningCorruptionScore(): bigint {
    let total = 0n;
    for (let i = 0; i < this.inspectedCount; i += 1) {
      const line = this.analysis.results[i]!;
      if (line.status === 'corrupted') total += line.corruptionScore;
    }
    return total;
  }

  get corruptionCounts(): Readonly<Record<CloseBracket, number>> {
    const counts: Record<CloseBracket, number> = { ')': 0, ']': 0, '}': 0, '>': 0 };
    for (let i = 0; i < this.inspectedCount; i += 1) {
      const line = this.analysis.results[i]!;
      if (line.status === 'corrupted') counts[line.found] += 1;
    }
    return Object.freeze(counts);
  }
}

/** Trace frame capturing progressive autocomplete-score collection and running median (Part 2). */
export class AutocompleteScanFrame {
  readonly kind = 'autocomplete-median' as const;
  readonly analysis: SyntaxAnalysis;
  readonly inspectedCount: number;

  constructor(analysis: SyntaxAnalysis, inspectedCount: number) {
    this.analysis = analysis;
    this.inspectedCount = validateInspectedCount(
      inspectedCount,
      analysis.incompleteLines.length,
      'AutocompleteScanFrame',
    );
    Object.freeze(this);
  }

  get currentLine(): IncompleteLineResult {
    return this.analysis.incompleteLines[this.inspectedCount - 1]!;
  }

  get inspectedIncompleteLines(): readonly IncompleteLineResult[] {
    return Object.freeze(this.analysis.incompleteLines.slice(0, this.inspectedCount));
  }

  get sortedInspectedLines(): readonly IncompleteLineResult[] {
    return Object.freeze(
      [...this.inspectedIncompleteLines].sort((a, b) => compareBigIntAsc(a.autocompleteScore, b.autocompleteScore)),
    );
  }

  get runningMedianLine(): IncompleteLineResult {
    const sorted = this.sortedInspectedLines;
    return sorted[Math.floor(sorted.length / 2)]!;
  }

  get runningMedianScore(): bigint {
    return this.runningMedianLine.autocompleteScore;
  }

  get maxInspectedScore(): bigint {
    const sorted = this.sortedInspectedLines;
    return sorted[sorted.length - 1]!.autocompleteScore;
  }
}

export type SyntaxTraceFrame = CorruptionScanFrame | AutocompleteScanFrame;
