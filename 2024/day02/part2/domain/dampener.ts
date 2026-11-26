import { isSafeStep, type Report, type StepFailure, type TrendDirection } from '../../shared';

export type DampenerOutcome =
  | { readonly kind: 'native-safe' }
  | { readonly kind: 'dampened-safe'; readonly initialFailure: StepFailure; readonly removedIndex: number }
  | { readonly kind: 'unsafe'; readonly initialFailure: StepFailure };

function isSafeSkipping(levels: readonly number[], skipIndex: number): boolean {
  let prev: number | null = null;
  let dir: TrendDirection | null = null;
  for (let i = 0; i < levels.length; i += 1) {
    if (i === skipIndex) continue;
    const cur = levels[i]!;
    if (prev !== null) {
      if (dir === null) {
        if (cur === prev) return false;
        dir = cur > prev ? 1 : -1;
      }
      if (!isSafeStep(prev, cur, dir)) return false;
    }
    prev = cur;
  }
  return true;
}

function candidateSkipIndices(failureIndex: number): readonly number[] {
  return failureIndex === 1 ? [0, 1, 2] : [failureIndex, failureIndex + 1];
}

function trendAfterSkip(levels: readonly number[], skipIndex: number): TrendDirection | null {
  if (levels.length - 1 < 2) return null;
  const firstIdx = skipIndex === 0 ? 1 : 0;
  const secondIdx = skipIndex <= 1 ? 2 : 1;
  return levels[secondIdx]! > levels[firstIdx]! ? 1 : -1;
}

function computeOutcome(report: Report): DampenerOutcome {
  const initialFailure = report.firstFailure();
  if (initialFailure === null) {
    return Object.freeze({ kind: 'native-safe' });
  }
  const candidates = candidateSkipIndices(initialFailure.index);
  for (let i = 0; i < candidates.length; i += 1) {
    const removedIndex = candidates[i]!;
    if (isSafeSkipping(report.levels, removedIndex)) {
      return Object.freeze({ kind: 'dampened-safe', initialFailure, removedIndex });
    }
  }
  return Object.freeze({ kind: 'unsafe', initialFailure });
}

/** Immutable evaluation of a reactor report under the Problem Dampener rule. */
export class DampenerEvaluation {
  readonly report: Report;
  readonly outcome: DampenerOutcome;

  private constructor(report: Report, outcome: DampenerOutcome) {
    this.report = report;
    this.outcome = outcome;
    Object.freeze(this);
  }

  static evaluate(report: Report): DampenerEvaluation {
    return new DampenerEvaluation(report, computeOutcome(report));
  }

  get isSafe(): boolean {
    return this.outcome.kind !== 'unsafe';
  }

  get removedIndex(): number | null {
    return this.outcome.kind === 'dampened-safe' ? this.outcome.removedIndex : null;
  }

  get initialFailure(): StepFailure | null {
    return this.outcome.kind === 'native-safe' ? null : this.outcome.initialFailure;
  }

  get dampenedTrend(): TrendDirection | null {
    if (this.outcome.kind === 'native-safe') return this.report.trend;
    if (this.outcome.kind === 'unsafe') return null;
    return trendAfterSkip(this.report.levels, this.outcome.removedIndex);
  }

  get didTrendFlip(): boolean {
    const dampened = this.dampenedTrend;
    return (
      this.outcome.kind === 'dampened-safe' &&
      this.report.trend !== null &&
      dampened !== null &&
      dampened !== this.report.trend
    );
  }
}
