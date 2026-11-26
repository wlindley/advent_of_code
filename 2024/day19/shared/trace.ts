import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { analyzeDesign } from './dp';
import type { DesignAnalysis, LinenLayout } from './model';
import { PatternTrie } from './trie';

export const DEFAULT_MAX_TRACE_STEPS = 80;

export interface LinenTraceFrame {
  readonly designIndex: number;
  readonly totalDesigns: number;
  readonly analysis: DesignAnalysis;
  readonly cumulativePossible: number;
  readonly cumulativeArrangements: bigint;
}

/**
 * Builds an endpoint-preserving trace of design analyses and exact running totals.
 * Accumulates across all designs even when sampled so the final frame reports exact totals.
 */
export function buildLinenTrace(
  layout: LinenLayout,
  options?: TraceOptions,
): readonly LinenTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const indices = sampleTraceIndices(layout.designCount, maxSteps);
  const trie = PatternTrie.fromPatterns(layout.patterns);
  const frames: LinenTraceFrame[] = [];
  let cumulativePossible = 0;
  let cumulativeArrangements = 0n;
  let emitPtr = 0;

  for (let i = 0; i < layout.designCount; i += 1) {
    const analysis = analyzeDesign(trie, layout.designs[i]!);
    if (analysis.possible) cumulativePossible += 1;
    cumulativeArrangements += analysis.wayCount;
    if (i === indices[emitPtr]!) {
      frames.push(Object.freeze({
        designIndex: i,
        totalDesigns: layout.designCount,
        analysis,
        cumulativePossible,
        cumulativeArrangements,
      }));
      emitPtr += 1;
    }
  }
  return Object.freeze(frames);
}
