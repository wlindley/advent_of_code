import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { MazeAnalysis } from './dijkstra';
import type { PathStep } from './types';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export type TracePhase = 'explore' | 'reconstruct' | 'complete';

export interface MazeTraceContext {
  readonly analysis: MazeAnalysis;
  readonly canonicalPath: readonly PathStep[];
  readonly maxSettledDist: number;
}

export interface MazeTraceFrame {
  readonly context: MazeTraceContext;
  readonly phase: TracePhase;
  readonly settledCount: number;
  readonly frontierCost: number;
  readonly pathStepsShown: number;
  readonly showOptimalMask: boolean;
}

function buildTraceContext(analysis: MazeAnalysis): MazeTraceContext {
  const canonicalPath = analysis.extractCanonicalPath();
  let maxSettledDist = 1;
  for (let i = 0; i < analysis.settledCount; i += 1) {
    const d = analysis.minCellDistAt(analysis.settledCellAt(i));
    if (d > maxSettledDist) maxSettledDist = d;
  }
  return Object.freeze({ analysis, canonicalPath, maxSettledDist });
}

function appendExploreFrames(
  frames: MazeTraceFrame[],
  context: MazeTraceContext,
  budget: number,
): void {
  const { analysis } = context;
  const indices = sampleTraceIndices(analysis.settledCount, budget);
  for (const idx of indices) {
    frames.push(Object.freeze({
      context,
      phase: 'explore',
      settledCount: idx + 1,
      frontierCost: analysis.minCellDistAt(analysis.settledCellAt(idx)),
      pathStepsShown: 0,
      showOptimalMask: false,
    }));
  }
}

function appendReconstructFrames(
  frames: MazeTraceFrame[],
  context: MazeTraceContext,
  budget: number,
): void {
  const { analysis, canonicalPath } = context;
  const indices = sampleTraceIndices(canonicalPath.length, budget);
  for (const idx of indices) {
    frames.push(Object.freeze({
      context,
      phase: 'reconstruct',
      settledCount: analysis.settledCount,
      frontierCost: canonicalPath[idx]!.cost,
      pathStepsShown: idx + 1,
      showOptimalMask: false,
    }));
  }
}

function createCompleteFrame(context: MazeTraceContext): MazeTraceFrame {
  const { analysis, canonicalPath } = context;
  const lastSettled = analysis.settledCellAt(analysis.settledCount - 1);
  return Object.freeze({
    context,
    phase: 'complete',
    settledCount: analysis.settledCount,
    frontierCost: analysis.isReachable ? analysis.bestScore : analysis.minCellDistAt(lastSettled),
    pathStepsShown: canonicalPath.length,
    showOptimalMask: true,
  });
}

/** Builds a bounded animation trace of Dijkstra exploration, path reconstruction, and optimal seats. */
export function buildMazeTrace(
  analysis: MazeAnalysis,
  options?: TraceOptions,
): readonly MazeTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const context = buildTraceContext(analysis);
  if (maxSteps === 1) {
    return Object.freeze([createCompleteFrame(context)]);
  }
  const budget = maxSteps - 1;
  const exploreBudget = analysis.isReachable && budget >= 2 ? Math.max(1, Math.round(budget * 0.65)) : budget;
  const reconstructBudget = analysis.isReachable ? budget - exploreBudget : 0;
  const frames: MazeTraceFrame[] = [];
  appendExploreFrames(frames, context, exploreBudget);
  if (reconstructBudget > 0) {
    appendReconstructFrames(frames, context, reconstructBudget);
  }
  frames.push(createCompleteFrame(context));
  return Object.freeze(frames);
}
