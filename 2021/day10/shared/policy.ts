import { sampleTraceIndices } from '../../../shared/core';
import type { SyntaxAnalysis } from './analysis';
import { AutocompleteScanFrame, CorruptionScanFrame, type SyntaxTraceFrame } from './trace';

export type SyntaxScoringPolicyId = 'corruption-score' | 'autocomplete-median';

/** Strategy interface decoupling Part 1 corruption scoring from Part 2 autocomplete median scoring. */
export interface SyntaxScoringPolicy<TTrace extends SyntaxTraceFrame = SyntaxTraceFrame> {
  readonly id: SyntaxScoringPolicyId;
  readonly label: string;
  readonly metricLabel: string;
  evaluate(analysis: SyntaxAnalysis): bigint;
  trace(analysis: SyntaxAnalysis, maxSteps: number): readonly TTrace[];
}

/** Part 1 policy: sum first illegal closing bracket penalties across all corrupted lines. */
export const CORRUPTION_SCORE_POLICY: SyntaxScoringPolicy<CorruptionScanFrame> = Object.freeze({
  id: 'corruption-score',
  label: 'Part 1 · Corruption Scoring',
  metricLabel: 'Error Score',
  evaluate(analysis: SyntaxAnalysis): bigint {
    return analysis.totalCorruptionScore;
  },
  trace(analysis: SyntaxAnalysis, maxSteps: number): readonly CorruptionScanFrame[] {
    const indices = sampleTraceIndices(analysis.results.length, maxSteps);
    return Object.freeze(indices.map((idx) => new CorruptionScanFrame(analysis, idx + 1)));
  },
});

/** Part 2 policy: middle autocomplete score across all non-corrupted incomplete lines. */
export const AUTOCOMPLETE_MEDIAN_POLICY: SyntaxScoringPolicy<AutocompleteScanFrame> = Object.freeze({
  id: 'autocomplete-median',
  label: 'Part 2 · Autocomplete Median',
  metricLabel: 'Median Score',
  evaluate(analysis: SyntaxAnalysis): bigint {
    return analysis.medianAutocompleteScore;
  },
  trace(analysis: SyntaxAnalysis, maxSteps: number): readonly AutocompleteScanFrame[] {
    if (analysis.incompleteLines.length === 0) {
      throw new RangeError('Cannot trace autocomplete median with zero incomplete lines');
    }
    const indices = sampleTraceIndices(analysis.incompleteLines.length, maxSteps);
    return Object.freeze(indices.map((idx) => new AutocompleteScanFrame(analysis, idx + 1)));
  },
});
