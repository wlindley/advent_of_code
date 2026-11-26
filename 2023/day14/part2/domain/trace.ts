import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import type { DishPlatform } from '../../shared';
import { analyzeSpinCycles, DEFAULT_TARGET_CYCLES, type SpinCycleAnalysis } from './cycle';

/** Default cap on sampled spin-cycle trace frames. */
export const DEFAULT_MAX_TRACE_STEPS = 80;

export type Part2TracePhase = 'initial' | 'transient' | 'cycle' | 'closure' | 'projection';

export interface Part2TraceStep {
  readonly step: number;
  readonly cycle: number;
  readonly phase: Part2TracePhase;
  readonly matchedCycle: number | null;
  readonly platform: DishPlatform;
}

type DraftTraceStep = Omit<Part2TraceStep, 'step'>;

function classifyHistoryPhase(cycle: number, cycleStart: number | null): Part2TracePhase {
  if (cycle === 0) return 'initial';
  if (cycleStart !== null && cycle >= cycleStart) return 'cycle';
  return 'transient';
}

function pickHistoryFrames(analysis: SpinCycleAnalysis, count: number): DraftTraceStep[] {
  const indices = sampleTraceIndices(analysis.history.length, count);
  const frames: DraftTraceStep[] = [];
  for (const cycle of indices) {
    frames.push({
      cycle,
      phase: classifyHistoryPhase(cycle, analysis.cycleStart),
      matchedCycle: null,
      platform: analysis.history[cycle]!,
    });
  }
  return frames;
}

function freezeSteps(drafts: readonly DraftTraceStep[]): readonly Part2TraceStep[] {
  const frames: Part2TraceStep[] = [];
  for (let step = 0; step < drafts.length; step += 1) {
    const draft = drafts[step]!;
    frames.push(
      Object.freeze({
        step,
        cycle: draft.cycle,
        phase: draft.phase,
        matchedCycle: draft.matchedCycle,
        platform: draft.platform,
      }),
    );
  }
  return Object.freeze(frames);
}

/** Builds a bounded trace of transient, cyclic, closure, and projected frames from an analysis. */
export function buildTraceFromAnalysis(
  analysis: SpinCycleAnalysis,
  options?: TraceOptions,
): readonly Part2TraceStep[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  if (analysis.cycleStart === null) {
    return freezeSteps(pickHistoryFrames(analysis, limit));
  }
  const projection: DraftTraceStep = {
    cycle: analysis.targetCycles,
    phase: 'projection',
    matchedCycle: analysis.equivalentCycle,
    platform: analysis.finalPlatform,
  };
  if (limit === 1) return freezeSteps([projection]);
  if (limit === 2) {
    const initial: DraftTraceStep = {
      cycle: 0,
      phase: 'initial',
      matchedCycle: null,
      platform: analysis.history[0]!,
    };
    return freezeSteps([initial, projection]);
  }
  const closure: DraftTraceStep = {
    cycle: analysis.history.length,
    phase: 'closure',
    matchedCycle: analysis.cycleStart,
    platform: analysis.history[analysis.cycleStart]!,
  };
  return freezeSteps([...pickHistoryFrames(analysis, limit - 2), closure, projection]);
}

/** Traces bounded spin-cycle progression for `platform` up to `targetCycles`. */
export function traceSpinCycles(
  platform: DishPlatform,
  options?: TraceOptions,
  targetCycles: number = DEFAULT_TARGET_CYCLES,
): readonly Part2TraceStep[] {
  return buildTraceFromAnalysis(analyzeSpinCycles(platform, targetCycles), options);
}
