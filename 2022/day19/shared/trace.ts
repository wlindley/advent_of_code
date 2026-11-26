import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { Blueprint } from './blueprint';
import { optimizeBlueprints } from './optimizer';
import {
  type BlueprintResult,
  type MinuteSnapshot,
  multiplyMaxGeodes,
  simulatePlan,
  sumQualityLevels,
} from './simulator';

export const DEFAULT_TRACE_MAX_STEPS = 64;

export type FactoryMode = 'quality-sum' | 'geode-product';

export interface FactoryTraceFrame {
  readonly mode: FactoryMode;
  readonly timeLimit: number;
  readonly results: readonly BlueprintResult[];
  readonly activeBlueprintIndex: number;
  readonly activeResult: BlueprintResult;
  readonly snapshots: readonly MinuteSnapshot[];
  readonly activeSnapshot: MinuteSnapshot;
  readonly runningAggregate: number;
  readonly finalAggregate: number;
}

function computeAggregate(results: readonly BlueprintResult[], mode: FactoryMode): number {
  return mode === 'quality-sum' ? sumQualityLevels(results) : multiplyMaxGeodes(results);
}

function assembleFrame(
  mode: FactoryMode,
  timeLimit: number,
  results: readonly BlueprintResult[],
  allSnapshots: ReadonlyArray<readonly MinuteSnapshot[]>,
  bpIdx: number,
  minute: number,
  finalAggregate: number,
): FactoryTraceFrame {
  const activeResult = results[bpIdx]!;
  const snapshots = allSnapshots[bpIdx]!;
  const completedCount = minute === timeLimit ? bpIdx + 1 : bpIdx;
  const runningAggregate =
    completedCount === 0 ? 0 : computeAggregate(results.slice(0, completedCount), mode);
  return Object.freeze({
    mode,
    timeLimit,
    results,
    activeBlueprintIndex: bpIdx,
    activeResult,
    snapshots,
    activeSnapshot: snapshots[minute]!,
    runningAggregate,
    finalAggregate,
  });
}

/** Builds bounded playback trace frames over blueprint optimization timelines. */
export function buildFactoryTrace(
  blueprints: readonly Blueprint[],
  timeLimit: number,
  mode: FactoryMode,
  options?: TraceOptions,
): readonly FactoryTraceFrame[] {
  if (blueprints.length === 0) {
    throw new RangeError('At least one blueprint is required to build a trace');
  }
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const evaluated = mode === 'geode-product' ? blueprints.slice(0, 3) : blueprints;
  const results = optimizeBlueprints(evaluated, timeLimit);
  const allSnapshots = results.map((res) => simulatePlan(res.blueprint, res.plan, timeLimit));
  const finalAggregate = computeAggregate(results, mode);
  const stepsPerBp = timeLimit + 1;
  const sampled = sampleTraceIndices(results.length * stepsPerBp, maxSteps);
  const frames: FactoryTraceFrame[] = [];
  for (const idx of sampled) {
    const bpIdx = Math.floor(idx / stepsPerBp);
    const minute = idx % stepsPerBp;
    frames.push(assembleFrame(mode, timeLimit, results, allSnapshots, bpIdx, minute, finalAggregate));
  }
  return Object.freeze(frames);
}
