import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import type { CavernPathResult } from './pathfinder';

export const DEFAULT_MAX_TRACE_STEPS = 48;

export type CavernTracePhase = 'wavefront' | 'path';

export interface CavernTraceFrameInit {
  readonly step: number;
  readonly phase: CavernTracePhase;
  readonly riskThreshold: number;
  readonly settledCount: number;
  readonly frontierCount: number;
  readonly pathRevealCount: number;
  readonly revealedPathRisk: number;
  readonly result: CavernPathResult;
}

/** Immutable wavefront-expansion or optimal-path-reveal trace snapshot. */
export class CavernTraceFrame {
  readonly step: number;
  readonly phase: CavernTracePhase;
  readonly riskThreshold: number;
  readonly settledCount: number;
  readonly frontierCount: number;
  readonly pathRevealCount: number;
  readonly revealedPathRisk: number;
  readonly result: CavernPathResult;

  constructor(init: CavernTraceFrameInit) {
    this.step = init.step;
    this.phase = init.phase;
    this.riskThreshold = init.riskThreshold;
    this.settledCount = init.settledCount;
    this.frontierCount = init.frontierCount;
    this.pathRevealCount = init.pathRevealCount;
    this.revealedPathRisk = init.revealedPathRisk;
    this.result = init.result;
    Object.freeze(this);
  }

  get goalReached(): boolean {
    return this.riskThreshold >= this.result.totalRisk;
  }

  get settledRatio(): number {
    return this.settledCount / this.result.map.cellCount;
  }
}

function buildDistancePrefixSums(result: CavernPathResult): Int32Array {
  const counts = new Int32Array(result.maxDistance + 1);
  const { distances } = result;
  const total = result.map.cellCount;
  for (let i = 0; i < total; i += 1) {
    const d = distances[i]!;
    counts[d] = counts[d]! + 1;
  }
  for (let d = 1; d < counts.length; d += 1) {
    counts[d] = counts[d]! + counts[d - 1]!;
  }
  return counts;
}

function buildWavefrontFrame(
  step: number,
  result: CavernPathResult,
  prefix: Int32Array,
): CavernTraceFrame {
  const settledCount = prefix[step]!;
  const frontierCount = step === 0 ? settledCount : settledCount - prefix[step - 1]!;
  return new CavernTraceFrame({
    step,
    phase: 'wavefront',
    riskThreshold: step,
    settledCount,
    frontierCount,
    pathRevealCount: 0,
    revealedPathRisk: 0,
    result,
  });
}

function buildPathFrame(
  step: number,
  pathRevealCount: number,
  result: CavernPathResult,
): CavernTraceFrame {
  const tipIndex = result.pathIndices[pathRevealCount - 1]!;
  return new CavernTraceFrame({
    step,
    phase: 'path',
    riskThreshold: result.maxDistance,
    settledCount: result.map.cellCount,
    frontierCount: 0,
    pathRevealCount,
    revealedPathRisk: result.distances[tipIndex]!,
    result,
  });
}

/** Samples unified wavefront + path-reveal frames up to `maxSteps` in O(V + maxDistance) time. */
export function traceCavernPath(
  result: CavernPathResult,
  options?: TraceOptions,
): readonly CavernTraceFrame[] {
  const maxSteps = validateMaxSteps(
    options === undefined ? undefined : options.maxSteps,
    DEFAULT_MAX_TRACE_STEPS,
  );
  const waveTotal = result.maxDistance + 1;
  const totalTimeline = waveTotal + result.pathLength;
  const indices = sampleTraceIndices(totalTimeline, maxSteps);
  const prefix = buildDistancePrefixSums(result);
  const frames: CavernTraceFrame[] = [];

  for (const idx of indices) {
    frames.push(
      idx < waveTotal
        ? buildWavefrontFrame(idx, result, prefix)
        : buildPathFrame(idx, idx - waveTotal + 1, result),
    );
  }
  return Object.freeze(frames);
}
